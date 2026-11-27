#!/bin/bash
# Render a screen recording into README and docs previews:
#   <name>-light.gif, <name>-dark.gif  device frame + shadow matted to GitHub's page colors
#   <name>.mp4                         plain screen for the docs, framed with CSS
#
# Usage: render.sh <recording.mp4> <name> [--out DIR] [--start SEC] [--end SEC]
#                  [--device phone|tablet] [--width PX] [--mask PDF|PNG|auto] [--radius RATIO] [--fps N]
#
# --mask is the device's real screen shape (opaque = screen), e.g. an iOS simulator's
# framebufferMask PDF. "auto" takes it from the recording's black rounded corners (Android).
# Without it, the screen gets circular corners of --radius.

set -euo pipefail

usage() {
  sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'
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
MASK=""
RADIUS=""
FPS=20

while [ $# -gt 0 ]; do
  case "$1" in
    --out) OUT="$2" ;;
    --start) START="$2" ;;
    --end) END="$2" ;;
    --device) DEVICE="$2" ;;
    --width) WIDTH="$2" ;;
    --mask) MASK="$2" ;;
    --radius) RADIUS="$2" ;;
    --fps) FPS="$2" ;;
    *) usage ;;
  esac
  shift 2
done

[ -f "$INPUT" ] || { echo "Recording not found: $INPUT" >&2; exit 1; }
[ -z "$MASK" ] || [ "$MASK" = auto ] || [ -f "$MASK" ] || { echo "Mask not found: $MASK" >&2; exit 1; }

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
CW=$((S + 2 * (P + M))); CH=$((H + 2 * (P + M)))
SX0=$((M + P)); SY0=$((M + P)); SX1=$((SX0 + S - 1)); SY1=$((SY0 + H - 1))
BLUR=$(awk "BEGIN { printf \"%d\", $S * 0.05 + 0.5 }")
MP4_W=$(( (S * 5 / 3) / 2 * 2 ))

TRIM=()
[ -n "$START" ] && TRIM+=(-ss "$START")
[ -n "$END" ] && TRIM+=(-to "$END")

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"

# Screen shape at the recording's size: white = screen
C=$((VW / 5))
if [ "$MASK" = auto ]; then
  # Android paints its rounded corners black over the screen. Flood-fill that black from each
  # corner of the brightest frame (so dark content can't pass for it), within the corner areas.
  ffmpeg -v error -y "${TRIM[@]}" -i "$INPUT" -vf fps=1 "$TMP/probe-%03d.png"
  magick "$TMP"/probe-*.png -evaluate-sequence max -colorspace sRGB -type TrueColor "$TMP/max.png"
  for p in 0,0 $((VW - 1)),0 0,$((VH - 1)) $((VW - 1)),$((VH - 1)); do
    [ "$(magick "$TMP/max.png" -format "%[fx:p{$p}.intensity < 0.02]" info:)" = 1 ] ||
      { echo "No black rounded corners in the recording; pass --mask <file> or --radius" >&2; exit 1; }
  done
  magick "$TMP/max.png" -fuzz 2% -fill red \
    -draw "color 0,0 floodfill" -draw "color $((VW - 1)),0 floodfill" \
    -draw "color 0,$((VH - 1)) floodfill" -draw "color $((VW - 1)),$((VH - 1)) floodfill" \
    -fill white +opaque red -fill black -opaque red -fill white \
    -draw "rectangle $C,0 $((VW - 1 - C)),$((VH - 1))" -draw "rectangle 0,$C $((VW - 1)),$((VH - 1 - C))" \
    -colorspace gray "$TMP/mask-full.png"
elif [ -n "$MASK" ]; then
  if [[ "$MASK" == *.pdf ]]; then
    sips -s format png --resampleWidth "$VW" "$MASK" --out "$TMP/mask.png" >/dev/null
  else
    cp "$MASK" "$TMP/mask.png"
  fi
  magick "$TMP/mask.png" -alpha extract -resize "${VW}x${VH}!" "$TMP/mask-full.png"
fi

# Screen shape on the canvas
if [ -n "$MASK" ]; then
  magick "$TMP/mask-full.png" -resize "${S}x${H}!" "$TMP/screen-only.png"
  magick -size ${CW}x${CH} xc:black "$TMP/screen-only.png" -geometry +$SX0+$SY0 -compose over -composite \
    -colorspace gray "$TMP/screen.png"
else
  magick -size ${CW}x${CH} xc:black -fill white \
    -draw "roundrectangle $SX0,$SY0 $SX1,$SY1 $R,$R" -colorspace gray "$TMP/screen.png"
fi

# Bezel and edge grow out of the screen shape, so every curve stays concentric with it
magick "$TMP/screen.png" -morphology Dilate "Disk:$(awk "BEGIN { print $P - 1.5 }")" "$TMP/body.png"
magick "$TMP/screen.png" -morphology Dilate "Disk:$(awk "BEGIN { print $P + 1.5 }")" "$TMP/edge.png"
magick "$TMP/edge.png" -roll +0+$((BLUR / 2)) -blur 0x$BLUR "$TMP/shadow.png"

# Page background, shadow opacity, device edge color
frame() {
  local theme=$1 bg=$2 shadow=$3 edge=$4
  magick -size ${CW}x${CH} "xc:$bg" \
    \( -size ${CW}x${CH} xc:black \( "$TMP/shadow.png" -evaluate multiply "$shadow" \) \
       -alpha off -compose CopyOpacity -composite \) -compose over -composite \
    \( -size ${CW}x${CH} "xc:$edge" "$TMP/edge.png" -alpha off -compose CopyOpacity -composite \) -compose over -composite \
    \( -size ${CW}x${CH} xc:'#101113' "$TMP/body.png" -alpha off -compose CopyOpacity -composite \) -compose over -composite \
    \( "$TMP/screen.png" -negate \) -alpha off -compose CopyOpacity -composite PNG32:"$TMP/frame-$theme.png"
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

# CSS border-radius for the docs frame, measured on the mask's top-left corner. A mask file gets
# the circle that crosses the corner's diagonal at the same depth (a close fit for continuous iOS
# corners). An auto mask gets the smallest circle that also covers the black corners baked into
# the video, so none of it shows inside the CSS clip.
CSS_RATIO=$RATIO
if [ -n "$MASK" ]; then
  corner() { magick "$TMP/mask-full.png" -crop "$1" +repage -depth 8 txt:- | sed -nE 's/^([0-9]+),([0-9]+): \(([0-9.]+).*/\1 \2 \3/p'; }
  DIAG=$(corner "${C}x${C}+0+0" | awk '!f && $1 == $2 && $3 > 127 { v = $1; f = 1 } END { print v }')
  EDGE=$(corner "${C}x1+0+0" | awk '!f && $3 > 127 { v = $1; f = 1 } END { print v }')
  CSS_RATIO=$(awk -v d="$DIAG" -v e="$EDGE" -v w="$VW" -v auto="$([ "$MASK" = auto ] && echo 1 || echo 0)" \
    'BEGIN { r = d / (1 - 1 / sqrt(2)); if (auto && e > r) r = e; printf "%.4f", r / w }')
fi

ls -lh "$OUT/$NAME-light.gif" "$OUT/$NAME-dark.gif" "$OUT/$NAME.mp4" | awk '{ print $5, $NF }'
echo "GIF ${CW}x${CH} (README width $((CW / 2)))"
echo "Docs frame: video border-radius $CSS_RATIO × video width (202px video → $(awk "BEGIN { printf \"%d\", 202 * $CSS_RATIO + 0.5 }")px)"
