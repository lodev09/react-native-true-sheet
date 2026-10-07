# Native debugging (temporary logs, crashes)

## Temporary logs

Add `RCTLogWarn(@"[TSDBG] <what> flag=%d", someBool);` at the branches under test (which path ran, which early-return fired, the state of `isPresented` / `isBeingDismissed` / pending flags). Rebuild, run the scenario, then read the log file from `debugger-log-registry` (`grep TSDBG <file>`; `uniq -c` collapses bursts). RCTLogWarn also triggers LogBox warning banners — harmless, ignore them.

Workflow when the fix is being written at the same time:

1. Keep a clean copy of each stage in `/tmp` (`.prefix` = user's diff, `.fixed` = with fixes) and add the logs to a throwaway copy.
2. Verify the bug with logs on the prefix, then the fix with logs on the fixed copy.
3. Restore the clean `.fixed` file and check `grep -c TSDBG ios/*.mm` is 0 before the final build.

Never touch the UIKit transition context asynchronously: messaging the `UIViewControllerTransitionCoordinatorContext` inside a `dispatch_async` from a coordinator completion crashes with SIGSEGV. Read what you need (e.g. `context.isCancelled`) into a local first.

## Crash triage

The app vanishing to the home screen means it died; `launch-app` then starts a fresh process.

1. Exit reason: `xcrun simctl spawn <UDID> log show --start "<time>" --end "<time>" --style compact --predicate 'eventMessage CONTAINS "<pid>"'` — runningboard/SpringBoard log `Process exited ... SIGSEGV(11)` etc. Find the pid from the app's own log lines (`processID == <pid>`).
2. Crash report: `~/Library/Logs/DiagnosticReports/TrueSheetExample-<date>.ips` (JSON after the first line). Parse the faulting thread:

   ```python
   import json; raw = open(path).read(); d = json.loads(raw.split('\n', 1)[1])
   th = d['threads'][d.get('faultingThread', 0)]; imgs = d['usedImages']
   for f in th['frames'][:15]: print(imgs[f['imageIndex']].get('name'), f.get('symbol'), f.get('symbolLocation'))
   ```

3. Map the offset to a line: in `.../Debug-iphonesimulator/TrueSheetExample.app/TrueSheetExample.debug.dylib`, `objdump -d --no-show-raw-insn <dylib> | awk '/<symbol>>:/{p=1} p{print; n++} n>60{exit}'`. The frame offset is the return address — the instruction before it is the faulting call (e.g. `bl _objc_msgSend$isCancelled` → a message to a freed object).

Block symbols read `__47-[TrueSheetView method]_block_invoke_2` — `_2` is the nested block inside the first one.
