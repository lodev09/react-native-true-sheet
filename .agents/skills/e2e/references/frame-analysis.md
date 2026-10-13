# Frame analysis (transient jumps, flicker, dim)

A 1-frame jump is invisible in screenshots and too fast to see reliably. Record it and track a pixel column (position) or a region's mean luma (dim) per frame.

## Record

`screen-recording-start` with `trimStatic: false` (keep real timing) and `showTouches: false` (no markers over the pixels), a short `timeLimitSeconds`. Run the interaction with `run-sequence` (fixed `delayMs` between taps), then `screen-recording-stop`. Videos land in `.argent/recordings/` (untracked).

Both platforms record at 30 fps: iPhone 17 Pro Max 1320×2868, Pixel_10_Pro_XL 1344×2992.

## Track a column

```sh
python3 scripts/track_column.py <video> --x <col> [--y0 --y1] --mode bright|band|edge [--lo --hi --run]
```

It prints `frame  t=..s  value` only when the value changes. Pick a column through something with a distinctive gray level and confine `--y0/--y1` to where it can be. ffmpeg only, no Python imaging libs needed.

Proven targets (bare example):

| Device          | Target                                      | Args                                                       | Reads                                                                       |
| --------------- | ------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| iPhone          | Footer "Default" pill (white)               | `--x 1155 --y0 2300 --mode bright --lo 200`                | footer position — must stay `(2607, 2662)` for a sheet pinned to the bottom |
| iPhone          | Grabber (gray)                              | `--x 660 --y0 300 --y1 2400 --mode band --lo 111 --hi 200` | sheet top                                                                   |
| iPhone          | Sheet top over the dark map                 | `--x 1200 --y0 120 --y1 2000 --mode edge --lo 12`          | sheet top (main-sheet column)                                               |
| Pixel_10_Pro_XL | Dark sheet (`#282e37`, gray ≈45) over a map | `--x 20 --mode edge --lo 35 --hi 55 --run 40`              | sheet top                                                                   |
| Pixel_10_Pro_XL | Floating button over an undimmed map        | `--x 1260 --mode edge --lo 0 --hi 51`                      | sheet position proxy (the button follows `animatedPosition`)                |

Other devices or apps: dump one frame and Read it, or print a column's values every 10 px to choose thresholds. Mark a tracked y to confirm what it reads:

```sh
ffmpeg -v error -ss 0.5 -i <video> -frames:v 1 -vf "drawbox=x=0:y=<y>:w=iw:h=4:color=red:t=fill,scale=336:-1" /tmp/frame.png
```

## Track a region's luma (dim)

```sh
ffmpeg -v error -i <video> -vf "crop=<w>:<h>:<x>:<y>,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-" -f null - \
  | paste - - | awk '{split($NF, a, "="); v = int(a[2] + 0.5); if (v != p) print $1, $3, v; p = v}'
```

Prints `frame:N pts_time:T luma` on change. Pick a region the sheet never covers. A steady dim prints one value; a dim that drops out and fades back mid-resize shows as a dip.

| Device          | Region                                                               | Dimmed vs undimmed |
| --------------- | -------------------------------------------------------------------- | ------------------ |
| Pixel_10_Pro_XL | `crop=110:75:1030:130` (map right of the log lines, left of the FAB) | 99 vs 198          |
| Pixel_10_Pro_XL | `crop=180:60:380:40` (status bar, when the sheet covers the map)     | 116 vs 232         |

A child stacked over a dimmed parent blends into the parent's dim at equal opacity, so its dim changes are invisible over the map. Present the child while the parent sits at an undimmed detent (e.g. `main` at peek, `__ts.insts[...].present()`).

iOS custom dim (`dimColor`/`dimOpacity`): probe it with `native-view-at-point` above the sheet and `skipClasses: ["TrueSheetOverlayContainerView", "UIDimmingView"]` — it's a plain `UIView` with the alpha and background color. The system dim isn't readable that way (`UIDimmingView` is clear), so use region luma.

## View several frames at once

```sh
ffmpeg -v error -i <video> -vf "select='between(n,53,58)',scale=224:-1,tile=6x1" -frames:v 1 /tmp/strip.png
```

Then Read the strip — six consecutive frames side by side.

## Read the trace

- Pinned element: one line for the whole run = no jump.
- Animated resize: a smooth monotonic series ending at the new value. A step against the direction of travel, or a value that snaps far away and animates back, is the glitch (e.g. the iOS footer jumping ~178 px / 59 pt on HEAD before settling).
- Units: px ÷ 3 = pt on @3x iPhones; px ÷ 3 = dp on Pixel_10_Pro_XL (`adb shell wm density` ÷ 160 elsewhere). A floating (non edge-attached) iOS sheet is scaled by the presentation (≈0.9636 on iPhone 18 Pro Max) — divide that out too before comparing with frame sizes from `native-full-hierarchy`.
- Pin down the culprit formula by running 2+ experiments with different content heights: the jump amount that tracks a specific quantity (e.g. "previous height − (footerHeight − inset)") names the code path.

Always A/B the same script against HEAD (SKILL.md §4) — "no jump" only means something next to the trace showing the jump on HEAD.
