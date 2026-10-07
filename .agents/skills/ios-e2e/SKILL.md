---
name: ios-e2e
description: End-to-end test TrueSheet native iOS changes on the simulator with the bare example app — build and install, drive the repro screens with argent, A/B against HEAD, and collect hard evidence (per-frame pixel tracking, onPositionChange realtime/settle logs, live prop overrides including mid-gesture, temporary native logs, crash triage). Use when asked to build and e2e on iOS, verify or review a change in ios/, reproduce a visual glitch (sheet or footer jumps, flicker, wrong height), check position or detent events, test prop-update timing around present/dismiss/cancelled swipes, or decide whether a bug is a regression vs HEAD.
---

# iOS E2E

Verify TrueSheet's native iOS behavior on the simulator with evidence, not eyeballing. Every claim — "fixed", "regression", "pre-existing" — should come with a frame trace, an event log, a debug log line, or an A/B result against HEAD.

Follow AGENTS.md: build only when the user asked for builds or e2e. Read `argent-device-interact` before driving the simulator.

## When to use

- A change in `ios/` needs to be built and exercised on the simulator, or reviewed for regressions.
- Something visibly misbehaves: a sheet or footer jumps, flickers, or lands at the wrong height.
- Event or timing correctness: `onPositionChange` realtime vs settled, detent changes, props applied (or lost) around present, dismiss, cancelled swipes, or stacked sheets.
- A bug report needs classifying as a regression or pre-existing by comparing against HEAD.

## 1. Build, install, launch

Bare example (`example/bare`, bundle id `truesheet.example`). Native library changes need a rebuild; JS changes hot-reload through Metro.

1. Metro: `yarn bare start` as a background command with the max timeout. It dies at the background time limit (the app then shows "Fast Refresh disconnected") and when files under the repo switch between symlink and directory (e.g. `.claude/skills`) — restart it, with `--reset-cache` if it reports a path "already exists in the file map as a file". Never run two Metros on 8081.
2. Device: `list-devices`, prefer the booted iPhone simulator.
3. Build — `react-native run-ios` fails on Xcode 27 (it opens the removed `Simulator.app`), so run xcodebuild from `example/bare/ios`:

   ```sh
   xcodebuild -workspace TrueSheetExample.xcworkspace -scheme TrueSheetExample \
     -configuration Debug -destination 'id=<UDID>' -derivedDataPath build build \
     > /tmp/truesheet-xcodebuild.log 2>&1; echo "EXIT $?"; grep -c "BUILD SUCCEEDED" /tmp/truesheet-xcodebuild.log
   ```

   An incremental rebuild after one `.mm` edit takes about a minute.

4. Install: argent `reinstall-app` with `example/bare/ios/build/Build/Products/Debug-iphonesimulator/TrueSheetExample.app`, then `launch-app`. `launch-app` relaunches the process, so app state resets.

## 2. Example app map

Launch lands on MapScreen with the `main` ReanimatedTrueSheet at peek. Reveal its buttons by swiping the grabber up (`fromY 0.905 → 0.45`, `durationMs 600`, `momentum: false`). A swipe right after launch is sometimes ignored (no `dragBegin` in the on-screen log) — retry it.

| Scenario                                              | Exercises                                                                                                         | Where                        |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| FlatList → "Switch to View/List"                      | Prop + size change in one commit (`scrollableHandle` flips with the content) — the coalesced deferred-update path | Main sheet → FlatList        |
| FlatList → Add/Remove Item                            | Size-only change                                                                                                  | Same sheet                   |
| FlatList → "OPEN BLANK SHEET"                         | Stacked child sheet (0.3 detent)                                                                                  | Footer button                |
| Main → Add/Remove Content                             | Size-only change; the floating button follows `animatedPosition`                                                  | Main sheet buttons           |
| ScrollView → Show ScrollView / Toggle ListView        | Late scrollable mount and remount, scroll edge effects                                                            | Main sheet → ScrollView      |
| Sheet Navigator → Details / Scrollable / Small Footer | `setOptions` footer and `scrollableRef`, `resize(1)`, stacked Settings + `pop()`                                  | Main sheet → Sheet Navigator |
| Test Screen → back                                    | Sheet dismissed by navigation and re-presented                                                                    | Main sheet → Test Screen     |

RN deep-diffs props: a parent re-render sends a native props update only when a value really changes (deep-equal inline objects and arrays do not). To hit the props path, change a real prop (the FlatList switch) or override one live (§3).

## 3. Evidence tools

- **Runtime hooks** — [references/runtime-hooks.md](references/runtime-hooks.md). Install `scripts/sheet-hooks.js` through `debugger-evaluate` to log every sheet's `onPositionChange` (position, `realtime`, index), override any prop live, change a prop on each drag event, and call `present`/`dismiss`/`resize` with precise timing.
- **Frame analysis** — [references/frame-analysis.md](references/frame-analysis.md). Record with `screen-recording-start` (`trimStatic: false`, `showTouches: false`), then `scripts/track_column.py` prints a pixel column's tracked edge per frame. A pinned element that prints one value for the whole run did not move; a 1-frame jump shows up as its own line.
- **Native debugging** — [references/native-debugging.md](references/native-debugging.md). Temporary `RCTLogWarn(@"[TSDBG] ...")` lines read back through `debugger-log-registry`, plus crash triage (crash report → faulting block → disassembly offset).

## 4. A/B against HEAD

To prove a regression or a fix, build both versions and run the same steps:

```sh
cp ios/<File>.mm /tmp/<File>.mm.work                 # back up the working change
git diff ios/<File>.mm > /tmp/<File>.patch
git show HEAD:ios/<File>.mm > ios/<File>.mm          # swap in HEAD, then build
cp /tmp/<File>.mm.work ios/<File>.mm                 # restore right after the build finishes
git diff ios/<File>.mm | diff - /tmp/<File>.patch && echo RESTORED_OK
```

Never `git stash` the user's work. Restore immediately after the build so the tree is never left on HEAD, and reinstall the working build at the end.

The same approach isolates your own fix from the user's diff: keep a clean copy of each stage (`/tmp/<File>.mm.prefix` for the user's diff, `.fixed` with your fixes) and build the stage under test.

## 5. Pitfalls

- `await-ui-element` text is a substring match: `"Settings Sheet"` also matches the "Open Settings Sheet" button underneath, so a `hidden` wait times out falsely. Pin a role or a more specific text.
- A `screenshot` right after a gesture can show the pre-transition state. Wait for the transition (or `await-screen-idle`) before judging.
- Known HEAD behavior, not regressions: taps right after a navigation push can be ignored, a 0.3-detent child hides the taller sheets behind it, and a sheet re-presented after navigation can land ~27pt too tall until the next size change.
- If another app takes the foreground (the simulator may be shared), the example's JS runtime suspends and `debugger-evaluate` times out. Don't relaunch over someone else's session — ask first.

## 6. Finish

1. Remove every temporary log (`grep -c TSDBG ios/*.mm` → 0) and debug-only code.
2. `clang-format ios/<File>.mm | diff -q ios/<File>.mm -` (repo `.clang-format`).
3. Final build and reinstall, then a short sanity pass over the scenarios the change touches.
4. Report each finding with its evidence (frame trace, event log, A/B), including pre-existing bugs found on HEAD.
