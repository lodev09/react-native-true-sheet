---
name: e2e
description: End-to-end test TrueSheet on the iOS simulator, the Android emulator, and mobile web (Safari / Chrome) — build and install the bare example or serve the expo example on web, drive the repro screens with argent, A/B against HEAD, and collect hard evidence (per-frame pixel and dim tracking, onPositionChange realtime/settle logs, live prop overrides including mid-gesture, temporary native logs, forced timing races, crash triage, live viewport readouts on web). Use when asked to build and e2e on iOS, Android, or web, verify or review a change in ios/, android/, or the web sheet (src/web, *.web.tsx), reproduce a visual glitch (sheet, footer, or dim jumps, flicker, wrong height), check position or detent events, check web keyboard or visual-viewport behavior, test prop-update timing around present/dismiss/cancelled swipes, reproduce a race or crash, or decide whether a bug is a regression vs HEAD.
metadata:
  internal: true
---

# E2E

Verify TrueSheet's behavior on the iOS simulator, the Android emulator, and mobile web with evidence, not eyeballing. Every claim — "fixed", "regression", "pre-existing" — should come with a frame trace, an event log, a debug log line, a viewport readout, or an A/B result against HEAD.

Read `argent-device-interact` before driving a device.

## When to use

- A change in `ios/`, `android/`, or the web sheet (`src/web`, `*.web.tsx`) needs to be exercised on a device or browser, or reviewed for regressions.
- Something visibly misbehaves: a sheet, footer, or dim jumps, flickers, or lands at the wrong height.
- Event or timing correctness: `onPositionChange` realtime vs settled, detent changes, props applied (or lost) around present, dismiss, cancelled swipes, or stacked sheets.
- A timing-dependent race or crash needs a deterministic repro.
- Web keyboard or visual-viewport behavior in mobile Safari or Chrome.
- A bug report needs classifying as a regression or pre-existing by comparing against HEAD.

## 1. Build, install, launch

Native: bare example (`example/bare`), iOS bundle id and Android package are both `truesheet.example` (Android activity `.MainActivity`). Native library changes need a rebuild; JS changes hot-reload through Metro.

1. Metro: `yarn bare start` as a background command with the max timeout. It dies at the background time limit (the app then shows "Fast Refresh disconnected") and when files under the repo switch between symlink and directory (e.g. `.claude/skills`) — restart it, with `--reset-cache` if it reports a path "already exists in the file map as a file". Never run two Metros on 8081, and never kill another project's Metro there (see Android below for `--port 8082`).
2. Device: `list-devices`, prefer the booted simulator or emulator of the platform under test.
3. Build and install, then `launch-app`. `launch-app` relaunches the process, so app state resets.

### iOS

`react-native run-ios` fails on Xcode 27 (it opens the removed `Simulator.app`), so run xcodebuild from `example/bare/ios`:

```sh
xcodebuild -workspace TrueSheetExample.xcworkspace -scheme TrueSheetExample \
  -configuration Debug -destination 'id=<UDID>' -derivedDataPath build build \
  > /tmp/truesheet-xcodebuild.log 2>&1; echo "EXIT $?"; grep -c "BUILD SUCCEEDED" /tmp/truesheet-xcodebuild.log
```

An incremental rebuild after one `.mm` edit takes about a minute. Install with argent `reinstall-app` and `example/bare/ios/build/Build/Products/Debug-iphonesimulator/TrueSheetExample.app`.

A branch that adds a codegen prop fails with "no member named X in TrueSheetViewProps" until `pod install` in `example/bare/ios`. Local CocoaPods rewrites the `COCOAPODS:` line of `Podfile.lock`; revert it only after the last build (xcodebuild fails "sandbox not in sync" otherwise).

### Android

Boot the emulator yourself with the hardware GPU, as a background command with the max timeout:

```sh
~/Library/Android/sdk/emulator/emulator -avd Pixel_10_Pro_XL -gpu host -noaudio -no-boot-anim
```

argent `boot-device` passes `-gpu auto`, which on macOS falls back to SwiftShader (software rendering): the map and sheet animations drop frames. Check with `adb shell dumpsys SurfaceFlinger | grep GLES` — it should not say SwiftShader. If an emulator is already running on SwiftShader, `adb emu kill` it and boot again with the command above.

```sh
cd example/bare/android && ./gradlew app:installDebug -PreactNativeArchitectures=arm64-v8a
```

Builds and installs in one step (a library-only incremental rebuild is about 10 s). The APK is `example/bare/android/app/build/outputs/apk/debug/app-debug.apk` — copy it per variant for A/B (§4).

- Run one Gradle build at a time: every example compiles the library into the shared root `android/build`, so parallel builds (or switching between bare and expo-58) leave stale codegen (`NoClassDefFoundError ...TrueSheetViewManagerInterface`). Recover with `rm -rf android/build` and a single rebuild.
- Metro on another port (8081 taken): `adb reverse` is not enough, the emulator dials `10.0.2.2:8081` and loads the other project's bundle (redbox "Cannot read property 'EventEmitter' of undefined"). Point the app at the new port, relaunch, and pass `port: 8082` to the argent debugger tools. When done, delete it (`adb shell run-as truesheet.example rm shared_prefs/truesheet.example_preferences.xml`).

  ```sh
  printf '<?xml version="1.0" encoding="utf-8"?>\n<map><string name="debug_http_host">10.0.2.2:8082</string></map>\n' \
    | adb shell "run-as truesheet.example sh -c 'mkdir -p shared_prefs && cat > shared_prefs/truesheet.example_preferences.xml'"
  ```

### Web

No build: serve the expo example on web (`yarn expo web --port 8090`) and open it with `open-url` in iOS Simulator Safari or Android emulator Chrome. See [references/web.md](references/web.md).

## 2. Example app map

Launch (or `/` on web) lands on MapScreen with the `main` ReanimatedTrueSheet (`dismissible={false}`) at peek. Reveal its buttons by swiping the grabber up (iOS: `fromY 0.905 → 0.45`, `durationMs 600`, `momentum: false`; take the grabber position from `describe` elsewhere). A swipe right after launch is often ignored — retry it, or on iOS/Android resize through the runtime hooks (`__ts.insts['main["peek","auto",1]'].resize(1)`).

| Scenario                                              | Exercises                                                                                                                 | Where                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| FlatList → "Switch to View/List"                      | Prop + size change in one commit (`scrollableHandle` flips with the content) — the coalesced deferred-update path         | Main sheet → FlatList        |
| FlatList → Add/Remove Item                            | Size-only change                                                                                                          | Same sheet                   |
| FlatList → "OPEN BLANK SHEET"                         | Stacked child sheet (0.3 detent)                                                                                          | Footer button                |
| Main → Add/Remove Content                             | Size-only change; the floating button follows `animatedPosition`                                                          | Main sheet buttons           |
| ScrollView → Show ScrollView / Toggle ListView        | Late scrollable mount and remount, scroll edge effects                                                                    | Main sheet → ScrollView      |
| Sheet Navigator → Details / Scrollable / Small Footer | `setOptions` footer and `scrollableRef`, `resize(1)`, stacked Settings + `pop()`                                          | Main sheet → Sheet Navigator |
| Test Screen → back                                    | Sheet dismissed by navigation and re-presented                                                                            | Main sheet → Test Screen     |
| Basic                                                 | Two `TrueSheetOverlay`s mounted with the sheet (activity-destroy paths on Android)                                        | Main sheet → TrueSheet View  |
| Basic on iPhone Duo (iOS 27.1)                        | `foldOptions` (`hingeDetentIndex: 1`, `'snap'`); tabletop needs a portrait UI (`rotate` LandscapeLeft) + `fold` half-open | Main sheet → TrueSheet View  |

RN deep-diffs props: a parent re-render sends a native props update only when a value really changes (deep-equal inline objects and arrays do not). To hit the props path, change a real prop (the FlatList switch) or override one live (§3). For a repro the example doesn't cover (e.g. a keyboard case with `detents={[0.6]}` and a search input in the header), edit the example screen temporarily and revert it before finishing.

## 3. Evidence tools

- **Runtime hooks** — [references/runtime-hooks.md](references/runtime-hooks.md). Install `scripts/sheet-hooks.js` through `debugger-evaluate` to log every sheet's `onPositionChange` (position, `realtime`, index), override any prop live, change a prop on each drag event, and call `present`/`dismiss`/`resize` with precise timing. iOS and Android only.
- **Frame analysis** — [references/frame-analysis.md](references/frame-analysis.md). Record with `screen-recording-start` (`trimStatic: false`, `showTouches: false`), then `scripts/track_column.py` prints a pixel column's tracked edge per frame, and an ffmpeg one-liner prints a region's mean luma per frame (dim). A pinned element that prints one value for the whole run did not move; a 1-frame jump shows up as its own line.
- **Native debugging** — [references/native-debugging.md](references/native-debugging.md). Temporary `[TSDBG]` logs (`RCTLogWarn` on iOS, `Log.d` on Android), forcing timing races (blocked JS + `adb` input, heavy renders), and crash triage per platform.
- **Web** — [references/web.md](references/web.md). A temporary live readout of the viewport and drawer geometry read through `describe`, plus measured Safari/Chrome keyboard and viewport facts.

## 4. A/B against HEAD

To prove a regression or a fix, build both versions and run the same steps:

```sh
cp <path> /tmp/<File>.work                 # back up the working change (ios/X.mm, android/.../X.kt)
git diff <path> > /tmp/<File>.patch
git show HEAD:<path> > <path>              # swap in HEAD, then build
cp /tmp/<File>.work <path>                 # restore right after the build finishes
git diff <path> | diff - /tmp/<File>.patch && echo RESTORED_OK
```

Never `git stash` the user's work. Restore immediately after the build so the tree is never left on HEAD, and reinstall the working build at the end.

- Android: keep each variant's APK (`cp .../app-debug.apk /tmp/truesheet-ab/head.apk`, `pr.apk`) and swap with `reinstall-app` instead of rebuilding.
- JS-only changes (`src/`, including web): one build is enough — swap the `src/` files the same way, then `debugger-reload-metro` (native) or reload with a new `?r=N` (web).
- The same approach isolates your own fix from the user's diff: keep a clean copy of each stage (`/tmp/<File>.prefix` for the user's diff, `.fixed` with your fixes) and build the stage under test.

## 5. Pitfalls

- `await-ui-element` text is a substring match: `"Settings Sheet"` also matches the "Open Settings Sheet" button underneath, so a `hidden` wait times out falsely. Pin a role or a more specific text.
- A `screenshot` right after a gesture can show the pre-transition state. Wait for the transition (or `await-screen-idle`) before judging.
- Taps that seem ignored right after a launch or navigation are an argent timing artifact, not a TrueSheet bug — wait for the sheet to settle and retry before concluding anything.
- If another app takes the foreground (devices may be shared), the example's JS runtime suspends and `debugger-evaluate` times out. Don't relaunch over someone else's session — ask first.
- iOS: a 0.3-detent child (FlatList "OPEN BLANK SHEET") hides the taller sheets behind it while presented (likely UIKit on iOS 26+, not a regression).
- iOS 27: tapping the system dim of a `dismissible={false}` sheet does not emit `onDismissAttempt`; only a swipe does.
- Android: `onPositionChange` can flip between the target and the real top when Material's nested pre-scroll snaps the sheet — cross-check with frames.
- Android: activity recreation (e.g. `adb shell settings put system font_scale 1.15`) crashes the bare example in react-native-screens' fragment restore — an example-app issue, not TrueSheet. Reset `font_scale` to 1.0 afterwards.

## 6. Finish

1. Remove every temporary log (`grep -rn TSDBG ios android/src` → nothing), debug-only code, web readout probes, and temporary example edits.
2. Format what you touched: `clang-format ios/<File>.mm | diff -q ios/<File>.mm -` (iOS), `scripts/ktlint.sh` (Android, formats in place), `yarn typecheck && yarn lint` (TS).
3. Final build and reinstall (native) or fresh load (web), then a short sanity pass over the scenarios the change touches on each affected platform.
4. Report each finding with its evidence (frame trace, event log, A/B), including pre-existing bugs found on HEAD.
5. After the pass, or after the commit and push when one was asked for, tear everything down:
   - Metro and the expo web server: kill the PIDs listening on their ports (`lsof -nP -iTCP:8081 -sTCP:LISTEN`, plus 8082/8090 if used), after checking with `ps -o command -p <pid>` that each one serves this repo.
   - Simulator servers: `stop-all-simulator-servers` with `devices: [...]` naming the devices this session used.
   - Devices this session used: `xcrun simctl shutdown <UDID>` (iOS) and `adb -s <serial> emu kill` (Android).
