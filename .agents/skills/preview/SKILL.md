---
name: preview
description: Record and render TrueSheet preview animations for the README, docs, and blog — drive the bare example on the iOS simulator, Android emulator, iPad, or mobile Safari with argent, record a clean screen capture, and render it into a light/dark GIF pair framed in a device for GitHub and a plain MP4 for the docs. Use when asked to create, update, or re-record a preview, demo GIF, feature GIF, or blog animation, or when a preview looks outdated or bad in dark mode.
---

# Preview

Previews are scripted screen recordings of the example app, rendered by `scripts/render.sh` into:

| File                                  | Used by         | Look                                                                  |
| ------------------------------------- | --------------- | --------------------------------------------------------------------- |
| `<name>-light.gif`, `<name>-dark.gif` | README (GitHub) | Device frame and shadow, matted to GitHub's white and `#0d1117` pages |
| `<name>.mp4`                          | Docs and blog   | Plain screen; the docs frame it with CSS, so it fits both themes      |

GIF has no soft transparency, so each theme gets its own GIF and the README picks one with `<picture>`. Files go in `docs/public/img/previews/`.

Read `argent-device-interact` and `argent-screen-recording` before driving a device. Build, install, and Metro setup are in the `e2e` skill §1.

## 1. Prepare the device

Every preview uses the same clean state: 9:41, full battery, dark appearance, no touch markers, no watermark, no debug overlays.

iOS simulator:

```sh
xcrun simctl status_bar <UDID> override --time 9:41 --batteryState charged --batteryLevel 100 \
  --cellularMode active --cellularBars 4 --wifiBars 3 --dataNetwork wifi
xcrun simctl ui <UDID> appearance dark
```

Android emulator:

```sh
adb shell settings put global sysui_demo_allowed 1
adb shell am broadcast -a com.android.systemui.demo -e command enter
adb shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 0941
adb shell am broadcast -a com.android.systemui.demo -e command battery -e level 100 -e plugged false
adb shell am broadcast -a com.android.systemui.demo -e command network -e wifi show -e level 4 -e mobile show -e level 4
adb shell am broadcast -a com.android.systemui.demo -e command notifications -e visible false
adb shell cmd uimode night yes
```

Both:

- `argent disable video-watermark` (global flag, re-enable in §5).
- Hide MapScreen's on-screen event log with a temporary edit in `example/shared/src/screens/MapScreen.tsx`: render nothing from `logs` (e.g. `logs.slice(0, 0).map(...)`). Revert it in §5.
- Close any LogBox banner before recording.
- iPad: rotate to the orientation you want before recording; the video keeps the size of the first frame.
- Web: serve the expo example and open it in iOS Simulator Safari (`e2e` skill, `references/web.md`). Safari's toolbar stays in the shot.

## 2. Record

1. `launch-app` (or `restart-app`) so the scene starts from a known state, then wait ~2 s: a swipe right after launch is often ignored.
2. Find targets with `describe`. Coordinates differ per device, so never reuse them across devices.
3. Dry-run the steps once without recording, then `restart-app`.
4. `screen-recording-start` with `showTouches: false` and a `timeLimitSeconds` a little over the scene. Set the stop reminder the recording skill requires.
5. Drive the whole scene in one `run-sequence`. Give every step a `delayMs` of 1200–1500 so each state reads before the next one starts, and end on the same state the scene started on so the loop is seamless.
6. `screen-recording-stop`. The mp4 lands in `.argent/recordings/` (gitignored). Static stretches are already trimmed to 1 s.

Sheet drags: use a 500 ms swipe from the grabber (default momentum). A `momentum: false` swipe from peek is often ignored.

Example scene (MapScreen, 10 s): swipe the grabber up from peek → tap "TrueSheet View" (stacked sheet) → tap "Add Content" twice → swipe the stacked sheet down → swipe the main sheet back to peek.

## 3. Pick the loop

Make a contact sheet, one frame per second:

```sh
ffmpeg -v error -y -i <recording.mp4> -vf "fps=1,scale=180:-1,tile=7x2" -frames:v 1 /tmp/preview-strip.png
```

Choose `--start` just before the first movement and `--end` just after the last state settles. Keep previews under ~12 s; the GIFs grow with length and with how much of the screen moves (the map's polyline animation counts).

## 4. Render

```sh
.agents/skills/preview/scripts/render.sh <recording.mp4> <name> --start <sec> --end <sec>
```

| Option     | Default                       | Notes                                                              |
| ---------- | ----------------------------- | ------------------------------------------------------------------ |
| `--device` | `phone`                       | `tablet` for iPad: thinner bezel, smaller corner radius            |
| `--width`  | 360 (phone), 744 (tablet)     | Screen width in the GIF. The GIF renders at 2x of its README width |
| `--radius` | 0.128 (phone), 0.025 (tablet) | Screen corner radius as a ratio of the width. Adjust per device    |
| `--fps`    | 20                            | GIF only; the MP4 stays at 30, the recording's rate                |
| `--out`    | `docs/public/img/previews`    |                                                                    |

Check the result before embedding:

- At the defaults, 10 s of phone footage renders to ~7 MB per GIF and ~1.4 MB of MP4. Shorten the scene or lower `--fps` if a GIF grows past ~8 MB.
- Look at one frame of each GIF (`ffmpeg -ss 4 -i <gif> -frames:v 1 /tmp/f.png`): the corners and shadow should blend into the page with no box around the device.

## 5. Embed and restore

README, at half the GIF's pixel width (the script prints it):

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/public/img/previews/<name>-dark.gif" />
  <img alt="TrueSheet on iOS" src="docs/public/img/previews/<name>-light.gif" width="228" />
</picture>
```

Docs and blog (MDX):

```tsx
<video src="/img/previews/<name>.mp4" autoPlay loop muted playsInline />
```

`muted` and `playsInline` are required for autoplay on iOS Safari. Frame the phone video with CSS to match the GIFs: video 202px wide with a 26px radius, inside a 7px `#101113` bezel with a 2px `#3d4048` border, 35px outer radius, and a soft shadow.

Restore everything you changed:

- iOS: `xcrun simctl status_bar <UDID> clear`, and set the appearance back (`xcrun simctl ui <UDID> appearance light`).
- Android: `adb shell am broadcast -a com.android.systemui.demo -e command exit` and `adb shell cmd uimode night no`.
- `argent enable video-watermark`.
- Revert the MapScreen edit (`git diff example/` shows nothing).
- Stop Metro and the simulator servers as in the `e2e` skill §6.
