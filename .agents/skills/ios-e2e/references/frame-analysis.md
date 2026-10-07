# Frame analysis (transient jumps, flicker)

A 1-frame jump is invisible in screenshots and too fast to see reliably. Record it and track a pixel column per frame.

## Record

`screen-recording-start` with `trimStatic: false` (keep real timing) and `showTouches: false` (no markers over the pixels), a short `timeLimitSeconds`. Run the interaction with `run-sequence` (fixed `delayMs` between taps), then `screen-recording-stop`. Videos land in `.argent/recordings/` (untracked).

## Track

```sh
python3 scripts/track_column.py <video> --x <col> [--y0 --y1] --mode bright|band|edge [--lo --hi --run]
```

It prints `frame  t=..s  value` only when the value changes. Pick a column through something with a distinctive gray level and confine `--y0/--y1` to where it can be.

Proven targets on an iPhone 17 Pro Max recording (1320×2868 @ 30 fps, bare example):

| Target                        | Args                                                       | Reads                                                                       |
| ----------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| Footer "Default" pill (white) | `--x 1155 --y0 2300 --mode bright --lo 200`                | footer position — must stay `(2607, 2662)` for a sheet pinned to the bottom |
| Grabber (gray)                | `--x 660 --y0 300 --y1 2400 --mode band --lo 111 --hi 200` | sheet top                                                                   |
| Sheet top over the dark map   | `--x 1200 --y0 120 --y1 2000 --mode edge --lo 12`          | sheet top (main-sheet column)                                               |

Other devices or apps: dump one frame (`ffmpeg -ss 0.5 -i <video> -frames:v 1 -vf crop=...`) and Read it, or print a column's values every 10 px to choose thresholds.

## Read the trace

- Pinned element: one line for the whole run = no jump.
- Animated resize: a smooth monotonic series ending at the new value. A step against the direction of travel, or a value that snaps far away and animates back, is the glitch (e.g. the footer jumping ~178 px / 59 pt on HEAD before settling).
- Units: px ÷ 3 = pt on @3x devices. A floating (non edge-attached) sheet is scaled by the presentation (≈0.9636 on iPhone 18 Pro Max) — divide that out too before comparing with frame sizes from `native-full-hierarchy`.
- Pin down the culprit formula by running 2+ experiments with different content heights: the jump amount that tracks a specific quantity (e.g. "previous height − (footerHeight − inset)") names the code path.

Always A/B the same script against HEAD (SKILL.md §4) — "no jump" only means something next to the trace showing the jump on HEAD.
