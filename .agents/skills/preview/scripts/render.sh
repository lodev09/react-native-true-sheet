#!/bin/bash
# Render a screen recording into README and docs previews:
#   <name>-light.gif, <name>-dark.gif  device frame + shadow matted to GitHub's page colors
#   <name>.mp4                         plain screen for the docs, framed with CSS
#
# Usage: render.sh <recording.mp4> <name> [--out DIR] [--start SEC] [--end SEC]
#                  [--device phone|tablet] [--width PX] [--radius RATIO] [--fps N]

set -euo pipefail

usage() {
  sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
}

[ $# -lt 2 ] && usage
INPUT="$1"
NAME="$2"
shift 2

OUT="docs/public/img/previews"
START=""
END=""
DEVICE="phone"
WIDTH=""
RADIUS=""
FPS=20

while [ $# -gt 0 ]; do
  case "$1" in
    --out) OUT="$2" ;;
    --start) START="$2" ;;
    --end) END="$2" ;;
    --device) DEVICE="$2" ;;
    --width) WIDTH="$2" ;;
    --radius) RADIUS="$2" ;;
    --fps) FPS="$2" ;;
    *) usage ;;
  esac
  shift 2
done

[ -f "$INPUT" ] || { echo "Recording not found: $INPUT" >&2; exit 1; }

# Screen width, corner radius, bezel and margin as ratios of the screen width
case "$DEVICE" in
  phone) DEF_WIDTH=360; DEF_RADIUS=0.128; BEZEL=0.033; MARGIN=0.1 ;;
  tablet) DEF_WIDTH=744; DEF_RADIUS=0.025; BEZEL=0.016; MARGIN=0.05 ;;
  *) echo "Unknown device: $DEVICE" >&2; exit 1 ;;
esac
S=${WIDTH:-$DEF_WIDTH}
RATIO=${RADIUS:-$DEF_RADIUS}

IFS=x read -r VW VH < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$INPUT")
H=$(( (S * VH / VW) / 2 * 2 ))
R=$(awk "BEGIN { printf \"%d\", $S * $RATIO + 0.5 }")
P=$(awk "BEGIN { printf \"%d\", $S * $BEZEL + 0.5 }")
M=$(awk "BEGIN { printf \"%d\", $S * $MARGIN + 0.5 }")
DW=$((S + 2 * P)); DH=$((H + 2 * P)); DR=$((R + P))
CW=$((DW + 2 * M)); CH=$((DH + 2 * M))
X0=$M; Y0=$M; X1=$((M + DW - 1)); Y1=$((M + DH - 1))
SX0=$((M + P)); SY0=$((M + P)); SX1=$((M + P + S - 1)); SY1=$((M + P + H - 1))
BLUR=$(awk "BEGIN { printf \"%d\", $S * 0.05 + 0.5 }")
MP4_W=$(( (S * 5 / 3) / 2 * 2 ))

TRIM=()
[ -n "$START" ] && TRIM+=(-ss "$START")
[ -n "$END" ] && TRIM+=(-to "$END")

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"

# Page background, shadow opacity, device edge color
frame() {
  local theme=$1 bg=$2 shadow=$3 edge=$4
  magick -size ${CW}x${CH} "xc:$bg" \
    \( -size ${CW}x${CH} xc:none -fill "rgba(0,0,0,$shadow)" \
       -draw "roundrectangle $X0,$((Y0 + BLUR / 2)) $X1,$((Y1 + BLUR / 2)) $DR,$DR" -blur 0x$BLUR \) -composite \
    -fill '#101113' -stroke "$edge" -strokewidth 3 -draw "roundrectangle $X0,$Y0 $X1,$Y1 $DR,$DR" \
    \( -size ${CW}x${CH} xc:white -fill black -draw "roundrectangle $SX0,$SY0 $SX1,$SY1 $R,$R" \) \
    -alpha off -compose CopyOpacity -composite PNG32:"$TMP/frame-$theme.png"
}

# Composite in RGB so the page color survives exactly, force it into the palette,
# and use error diffusion so flat areas keep it (ordered dithering shifts it).
gif() {
  local theme=$1 bg=$2
  ffmpeg -v error -y "${TRIM[@]}" -i "$INPUT" -i "$TMP/frame-$theme.png" -filter_complex \
    "[0:v]fps=$FPS,scale=${S}:${H}:flags=lanczos[v];color=c=black:s=${CW}x${CH}:r=$FPS[c];[c][v]overlay=${SX0}:${SY0}:shortest=1:format=rgb[b];[b][1:v]overlay=0:0:format=rgb,format=bgr0" \
    -c:v ffv1 -pix_fmt bgr0 "$TMP/comp-$theme.mkv"
  ffmpeg -v error -y -i "$TMP/comp-$theme.mkv" \
    -vf "palettegen=max_colors=255:reserve_transparent=0:stats_mode=full" "$TMP/pal-$theme.png"
  magick "$TMP/pal-$theme.png" -fill "$bg" -draw 'point 15,15' "$TMP/pal-$theme.png"
  ffmpeg -v error -y -i "$TMP/comp-$theme.mkv" -i "$TMP/pal-$theme.png" \
    -lavfi "[0:v][1:v]paletteuse=dither=sierra2_4a:diff_mode=rectangle" "$OUT/$NAME-$theme.gif"
}

frame light '#ffffff' 0.28 '#3a3c41'
frame dark '#0d1117' 0.55 '#3d4048'
gif light '#ffffff'
gif dark '#0d1117'

ffmpeg -v error -y "${TRIM[@]}" -i "$INPUT" -vf "fps=30,scale=${MP4_W}:-2:flags=lanczos" \
  -c:v libx264 -crf 21 -preset slow -pix_fmt yuv420p -movflags +faststart -an "$OUT/$NAME.mp4"

ls -lh "$OUT/$NAME-light.gif" "$OUT/$NAME-dark.gif" "$OUT/$NAME.mp4" | awk '{ print $5, $NF }'
echo "GIF ${CW}x${CH} (README width $((CW / 2))), screen corner radius ratio $RATIO"
