# Native debugging (temporary logs, races, crashes)

## Temporary logs

Log at the branches under test (which path ran, which early return fired, the state of presented / dismissing / pending flags). Prefix every line with `[TSDBG]` so it's easy to grep and to remove.

- iOS: `RCTLogWarn(@"[TSDBG] <what> flag=%d", someBool);`. Rebuild, run the scenario, then read the log file from `debugger-log-registry` (`grep TSDBG <file>`; `uniq -c` collapses bursts). RCTLogWarn also triggers LogBox warning banners — harmless, ignore them.
- Android: `Log.d("TSDBG", "<what> flag=$someBool")` (`android.util.Log`). `adb -s <serial> logcat -c` before the run, then `adb -s <serial> logcat -d -s TSDBG`.

Workflow when the fix is being written at the same time:

1. Keep a clean copy of each stage in `/tmp` (`.prefix` = user's diff, `.fixed` = with fixes) and add the logs to a throwaway copy.
2. Verify the bug with logs on the prefix, then the fix with logs on the fixed copy.
3. Restore the clean `.fixed` file and check `grep -rn TSDBG ios android/src` prints nothing before the final build.

iOS: never touch the UIKit transition context asynchronously. Messaging the `UIViewControllerTransitionCoordinatorContext` inside a `dispatch_async` from a coordinator completion crashes with SIGSEGV. Read what you need (e.g. `context.isCancelled`) into a local first.

## Forcing timing races

Races that need the JS and UI threads to interleave a certain way are flaky by hand. Make them deterministic:

- **Block JS while the UI thread acts.** Start a busy-wait with `debugger-evaluate` (`(() => { const t = Date.now(); while (Date.now() - t < 8000) {} })()`) — the call blocks — and, from a background Bash command started just before, send native input meanwhile:

  ```sh
  sleep 1; adb shell input keyevent KEYCODE_BACK
  adb shell am start -n truesheet.example/.MainActivity -f 0x10008000   # NEW_TASK|CLEAR_TASK: destroy the activity
  ```

  The queued work runs against a surface that is already stopped while JS still holds the tree. This reproduced the Android back-press `VIEW_NOT_FOUND` rejection (#921) and the overlay detach NPE on activity destroy (#922, with the Basic sheet's overlays mounted).

- **Heavy render after node creation.** Mount the sheet followed by a sibling that busy-waits ~500 ms in render. Android Fabric then preallocates the sheet's view with its initial state on a UI frame before the JS commit lands, so a state update on that wrapper is dropped (#905). Measure the host with `nativeRef.current.measure` — the parent's size instead of the screen's is the bug.

## Crash triage

The app vanishing to the home screen or launcher means it died; `launch-app` then starts a fresh process.

### iOS

1. Exit reason: `xcrun simctl spawn <UDID> log show --start "<time>" --end "<time>" --style compact --predicate 'eventMessage CONTAINS "<pid>"'` — runningboard/SpringBoard log `Process exited ... SIGSEGV(11)` etc. Find the pid from the app's own log lines (`processID == <pid>`).
2. Crash report: `~/Library/Logs/DiagnosticReports/TrueSheetExample-<date>.ips` (JSON after the first line). Parse the faulting thread:

   ```python
   import json; raw = open(path).read(); d = json.loads(raw.split('\n', 1)[1])
   th = d['threads'][d.get('faultingThread', 0)]; imgs = d['usedImages']
   for f in th['frames'][:15]: print(imgs[f['imageIndex']].get('name'), f.get('symbol'), f.get('symbolLocation'))
   ```

3. Map the offset to a line: in `.../Debug-iphonesimulator/TrueSheetExample.app/TrueSheetExample.debug.dylib`, `objdump -d --no-show-raw-insn <dylib> | awk '/<symbol>>:/{p=1} p{print; n++} n>60{exit}'`. The frame offset is the return address — the instruction before it is the faulting call (e.g. `bl _objc_msgSend$isCancelled` → a message to a freed object).

Block symbols read `__47-[TrueSheetView method]_block_invoke_2` — `_2` is the nested block inside the first one.

### Android

- Java/Kotlin crash: `adb -s <serial> logcat -d -b crash` — the `FATAL EXCEPTION` stack names the faulting frame.
- JS errors and unhandled promise rejections (e.g. `Uncaught (in promise) ... TrueSheetView with tag N not found`): `adb -s <serial> logcat -d -s ReactNativeJS`.
- Read the whole stack before blaming TrueSheet: a crash inside `ViewGroup.dispatchDetachedFromWindow` during `handleDestroyActivity` can come from a view removing itself mid-detach (the overlay case above), and activity recreation crashes in react-native-screens' fragment restore in the bare example regardless of TrueSheet.
