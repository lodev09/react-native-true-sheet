---
name: preview
description: Record and render TrueSheet preview animations for the README, docs, and blog — drive the bare example on the iOS simulator, Android emulator, iPad, or mobile Safari with argent, record a clean screen capture, and render it into a light/dark GIF pair framed in a device for GitHub and a plain MP4 for the docs. Use when asked to create, update, or re-record a preview, demo GIF, feature GIF, or blog animation, or when a preview looks outdated or bad in dark mode.
metadata:
  internal: true
---

# Preview

Previews are scripted screen recordings of the example app, rendered by `scripts/render.sh` into:

| File                                  | Used by         | Look                                                                  |
| ------------------------------------- | --------------- | --------------------------------------------------------------------- |
| `<name>-light.gif`, `<name>-dark.gif` | README (GitHub) | Device frame and shadow, matted to GitHub's white and `#0d1117` pages |
| `<name>.mp4`                          | Docs and blog   | Plain screen; the docs frame it with CSS, so it fits both themes      |

GIF has no soft transparency, so each theme gets its own GIF and the README picks one with `<picture>`. Files go in `docs/public/img/previews/`.

Read `argent-device-interact` and `argent-screen-recording` before driving a device.

## 1. Prepare

### Release build

Record a Release build of the bare example: no Metro, no LogBox or dev overlays, and production-speed JS, so animations don't drop frames. MapScreen's on-screen event log renders only in `__DEV__`, so it's gone too. The JS bundle is baked in at build time: make any example change first, and rebuild after every JS change.

iOS, from `example/bare/ios` (then install `build/Build/Products/Release-iphonesimulator/TrueSheetExample.app` with argent `reinstall-app`):

```sh
xcodebuild -workspace TrueSheetExample.xcworkspace -scheme TrueSheetExample \
  -configuration Release -destination 'id=<UDID>' -derivedDataPath build build \
  > /tmp/truesheet-xcodebuild-release.log 2>&1; echo "EXIT $?"
```

Android, from `example/bare/android`, with the emulator booted on the hardware GPU (`e2e` skill §1). Release is signed with the debug keystore, so this builds and installs in one step (about 3 min clean). Gradle only watches `example/bare` for the JS bundle and calls it up to date after an `example/shared` edit, so always rerun the bundle task:

```sh
./gradlew app:createBundleReleaseJsAndAssets --rerun app:installRelease -PreactNativeArchitectures=arm64-v8a
```

### Device

Every preview uses the same clean state: 9:41, full battery, dark appearance, no watermark, no debug overlays. Touch markers stay on so viewers see where each tap and drag lands.

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
adb shell am broadcast -a com.android.systemui.demo -e command network -e wifi show -e level 4 -e fully true
adb shell am broadcast -a com.android.systemui.demo -e command network -e mobile hide
adb shell am broadcast -a com.android.systemui.demo -e command notifications -e visible false
adb shell cmd uimode night yes
```

`fully true` drops the Wi-Fi "no internet" mark. The mobile icon is hidden because the emulator ignores the demo `datatype` and always shows "3G". Run these through `bash -c` from zsh: zsh doesn't split an `adb -s <serial> shell` stored in a variable.

Both:

- `argent disable video-watermark` (global flag, re-enable in §5).
- iPad: rotate to the orientation you want before recording. In landscape, the simulator still records the portrait framebuffer with the UI turned 90°, and `describe` frames and gestures use those raw axes (after `LandscapeLeft`, UI up is +x). Turn the recording upright before rendering (`ffmpeg -i <rec> -vf transpose=2 -crf 12 <upright.mp4>` for `LandscapeLeft`), and turn the mask the same way: `sips -s format png --resampleWidth <portrait width> <mask.pdf> --out mask.png`, then `magick mask.png -rotate -90 mask-landscape.png`.
- Web: serve the expo example and open it in iOS Simulator Safari (`e2e` skill, `references/web.md`). Safari's toolbar stays in the shot.

## 2. Record

1. `launch-app` (or `restart-app`) so the scene starts from a known state, then wait ~2 s: a swipe right after launch is often ignored.
2. Find targets with `describe`. Coordinates differ per device, so never reuse them across devices.
3. Dry-run the steps once without recording, then `restart-app`.
4. `screen-recording-start` with `showTouches: true` (the default) and a `timeLimitSeconds` a little over the scene. Set the stop reminder the recording skill requires. Argent draws a pulse for each tap and a trail for each swipe into the video, only for the gestures it drives, so every step of the scene has to go through argent. Don't also turn on Android's own `show_touches`: it would draw a second marker.
5. Drive the whole scene in one `run-sequence`. Keep it brisk: a `delayMs` of 800–900 after each step, about 450 between repeated taps on the same button. End on the same state the scene started on so the loop is seamless.
6. `screen-recording-stop`. The mp4 lands in `.argent/recordings/` (gitignored). Static stretches are already trimmed to 1 s.

Gestures:

- Drag a sheet up: a 300 ms `gesture-swipe` from the grabber. Scroll a list: a 250 ms swipe.
- A recording slows the simulator, so a fast swipe or short flick that works in the dry run can bounce back while recording (seen from peek to auto, and on the ScrollView sheet's dismiss flick). If that happens, use a 500 ms `momentum: false` drag that releases past the midpoint to the target detent, or a longer flick.
- Dismiss or collapse a sheet the way a person does: a short drag, then a flick. Use `gesture-custom` from the grabber or header, `interpolate: 8`:

  ```json
  [
    { "type": "Down", "x": 0.5, "y": 0.11 },
    { "type": "Move", "x": 0.5, "y": 0.17, "delayMs": 240 },
    { "type": "Move", "x": 0.5, "y": 0.33, "delayMs": 80 },
    { "type": "Up", "x": 0.5, "y": 0.35, "delayMs": 10 }
  ]
  ```

- Android: a flick from a middle detent doesn't skip to the lower one (Material snaps to the nearest detent by position, ignoring velocity), so end the flick past the midpoint between the two detents (e.g. drag 0.2 → 0.28, flick to 0.6). A single-detent sheet with `dismissThreshold="short"` dismisses on the short flick above.
- Gate each step that depends on a sheet opening or reaching a detent with an `await-ui-element` step. If a swipe is ignored, the taps after it land on other buttons, and swipes after it pan the map, which changes the state the loop has to end on.

### Foldables: capture the Device Hub window

The foldables preview shows the phone folding, which only Device Hub (Xcode 27's simulator window) draws, so it's a macOS capture of that window instead of an argent recording. There are no touch markers; the scene is driven by `fold`, not gestures.

- The app running the agent needs Screen & System Audio Recording permission (System Settings → Privacy & Security), applied after a relaunch. Without it `screencapture` fails with "could not create image".
- The whole window must be on screen; macOS doesn't render the part past the display edge. The agent can't move it without Accessibility permission, so ask the user to.
- Find the window ID by name with `CGWindowListCopyWindowInfo` (a few lines of Swift run with `swift`; filter on owner `Device Hub`).
- Use the dedicated "iPhone Duo (TrueSheet)" simulator: `fold open`, `rotate LandscapeLeft` (portrait UI, horizontal fold), launch the app, tap the main grabber (drags from the bottom edge are cancelled on the Duo), then TrueSheet View. Its `foldOptions` snap moves it to the hinge.
- Record with `screencapture -x -v -V 30 -l <window id> fold.mov` in the background, `fold half-open` after ~9 s, hold ~2.5 s, `fold open`. Pick the loop on the polyline cycle (§3), then crop to the phone (union of the flat and folded bounds; the window's background is `#1a1a1c`) and encode like `render.sh`'s MP4:

  ```sh
  ffmpeg -ss <start> -to <end> -i fold.mov -vf "fps=30,crop=<w>:<h>:<x>:<y>,scale=980:-2:flags=lanczos" \
    -c:v libx264 -crf 21 -preset slow -pix_fmt yuv420p -movflags +faststart -an docs/public/img/previews/foldables.mp4
  ```

- Embed with `<Preview device="duo" />`: no CSS bezel, since the video already shows the phone.

Example scene (MapScreen, 9 s): swipe the grabber up from peek → tap "FlatList" → tap "Add Item" until the list scrolls → scroll it to the bottom → drag and flick it down → tap "TrueSheet View" → tap "Auto", then "Peek" → tap the dim → drag and flick the main sheet back to peek.

## 3. Pick the loop

Make a contact sheet, one frame per second:

```sh
ffmpeg -v error -y -i <recording.mp4> -vf "fps=1,scale=180:-1,tile=7x2" -frames:v 1 /tmp/preview-strip.png
```

Choose `--start` just before the first movement and `--end` just after the last state settles. Keep previews under ~12 s; the GIFs grow with length and with how much of the screen moves (the map's polyline animation counts).

MapScreen's "True Sheet" polyline draws and erases on a loop, so a cut that shows the map only loops cleanly if it spans exactly one cycle. The cycle varies between recordings (9.8–10.7 s seen). Fill it with the scene, record with `trimStatic: false` and a few idle seconds on each side, then compare frames to find the pair of loop points that match best:

```sh
mkdir /tmp/lp && ffmpeg -v error -i <recording.mp4> -vf "fps=10,scale=330:-1" /tmp/lp/f%04d.png
for a in <frames before the scene>; do for d in $(seq 96 108); do b=$((a + d))
  echo "$(magick compare -metric RMSE /tmp/lp/f$(printf %04d $a).png /tmp/lp/f$(printf %04d $b).png null: 2>&1 | sed 's/.*(\(.*\))/\1/') $a $b"
done; done | sort -n | head
```

Frame `n` is at `(n - 1) / 10` s. Both ends of the cut must sit where the sheet is at rest and the map is back in place; under ~0.5% RMSE loops without a visible jump.

## 4. Render

```sh
.agents/skills/preview/scripts/render.sh <recording.mp4> <name> --start <sec> --end <sec>
```

| Option     | Default                       | Notes                                                                |
| ---------- | ----------------------------- | -------------------------------------------------------------------- |
| `--device` | `phone`                       | `tablet` for iPad: thinner bezel, smaller corner radius              |
| `--width`  | 360 (phone), 744 (tablet)     | Screen width in the GIF. The GIF renders at 2x of its README width   |
| `--mask`   |                               | Real screen shape: a PDF/PNG (iOS simulators) or `auto` (Android)    |
| `--radius` | 0.128 (phone), 0.025 (tablet) | Circular corner radius as a ratio of the width, when there's no mask |
| `--fps`    | 20                            | GIF only; the MP4 stays at 30, the recording's rate                  |
| `--out`    | `docs/public/img/previews`    |                                                                      |

The frame must follow the device's real screen corners: iOS draws sheet corners concentric with them, so a guessed radius shows. The bezel, edge, and shadow are grown out of that shape, so they stay concentric with it.

- iOS simulator: pass its `framebufferMask` PDF. Apple's corners are continuous curves, not circles, so no `--radius` matches them.

  ```sh
  TYPE="/Library/Developer/CoreSimulator/Profiles/DeviceTypes/iPhone 18 Pro Max.simdevicetype/Contents/Resources"
  MASK="$TYPE/$(plutil -extract framebufferMask raw "$TYPE/profile.plist").pdf"
  ```

- Android emulator: pass `--mask auto`. Android paints its rounded corners black over the screen, so they're in the recording, and the script takes the shape from them. Neither the radius `dumpsys display` reports nor the skin's `corner_radius` matches that black exactly, and the difference shows as a dark sliver in the corner.

Check the result before embedding:

- At the defaults, 10 s of phone footage renders to ~7 MB per GIF and ~1.4 MB of MP4. Keep every preview at the default 20 fps; a GIF of 8–9 MB is fine. Shorten the scene if one grows well past that.
- Look at one frame of each GIF (`ffmpeg -ss 4 -i <gif> -frames:v 1 /tmp/f.png`): the corners and shadow should blend into the page with no box around the device.

## 5. Embed and restore

README, at half the iOS GIF's height (878 → 439). Set only `height`, the same on every preview, so they line up; a taller GIF (Android, 456×896) comes out a little narrower:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/public/img/previews/<name>-dark.gif" />
  <img alt="TrueSheet on iOS" src="docs/public/img/previews/<name>-light.gif" height="439" />
</picture>
```

Docs and blog (MDX):

```tsx
<Preview label="TrueSheet on Android" src="/img/previews/<name>.mp4" device="android" />
```

`Preview` (`docs/components/preview.tsx`) frames the video like the GIFs: a `#101113` bezel with a 2px `#3d4048` border and a soft shadow. `device` (`ios`, the default, also for iOS Safari; `android`; `ipad`, landscape; or `duo`, a Device Hub window capture with no bezel) sets the screen aspect, the bezel, and the corner radius ratio that `render.sh` prints (0.1423 for the iPhone 18 Pro Max, 0.1270 for the Pixel 10 Pro XL, 0.0223 for the iPad Pro 13-inch). The iPad preview renders with `--device tablet --width 900` (a 1500px MP4) and shows at `height={558}`, 744px wide. Add a device there when you record on a new one. `height` defaults to 652 (300px wide on iOS, 1:2 with the 600px MP4 on retina screens; bigger upscales). Side by side, use `height={500}` in a `<div className="flex flex-wrap gap-4">` so three fit in one row.

Restore everything you changed:

- iOS: `xcrun simctl status_bar <UDID> clear`, and set the appearance back (`xcrun simctl ui <UDID> appearance light`).
- Android: `adb shell am broadcast -a com.android.systemui.demo -e command exit` and `adb shell cmd uimode night no`.
- `argent enable video-watermark`.
- Reinstall the Debug build (`e2e` skill §1) so the devices are back on Metro.
- Stop Metro, the web server, and the simulator servers as in the `e2e` skill §6.
