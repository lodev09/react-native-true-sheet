# Runtime hooks (debugger-evaluate)

Observe and drive sheets from JS without editing the example app. Needs Metro + `debugger-connect`. Works the same on iOS and Android.

## Install

Read `scripts/sheet-hooks.js` and pass its full contents as the `expression` of `debugger-evaluate`. It returns the labels it hooked, e.g.:

```
main["peek","auto",1]   unnamed["auto"]   unnamed[0.3]   scrollview[0.8,1]   basic["peek","auto",1] ...
```

`unnamed["auto"]` is the FlatList sheet, `unnamed[0.3]` its "OPEN BLANK SHEET" child. Re-install after every `launch-app`/`reinstall-app` (the JS runtime restarts).

## Position events: realtime vs settled

`__ts.take('unnamed["auto"]')` drains the log as `ms label position realtime index`.

- `realtime: true` — a live frame value (drag, transition tracking, layout pass). `ReanimatedTrueSheet` assigns it directly, so `animatedPosition` **snaps**.
- `realtime: false` — the sheet settled at a detent. `ReanimatedTrueSheet` **springs** to it.

A resize should end with exactly one `realtime: false` event at the final position. Red flags:

- the final position only arrives as `realtime: true` (settle dropped → Reanimated consumers snap);
- a `realtime: true` value that isn't the start or end position (the sheet visited a wrong height — a visual jump);
- two settles at different positions.

A sheet with a child on top mirrors the child's resize as its own non-realtime events; filter by label.

On Android the values can flip between the target and the real top when Material's nested pre-scroll snaps the sheet — confirm with a frame trace before calling it a jump.

iOS settle path for reference: `TrueSheetViewController` sets `_pendingContentSizeChange` / `_pendingDetentsChange`, and the next `viewWillLayoutSubviews` calls `settleAtDetentIndex` (non-realtime). Code paths that refresh the auto/peek heights before `setupSheetDetentsForSizeChange` runs hide the change and skip the settle.

## Live prop overrides

```js
__ts.set('unnamed["auto"]', 'backgroundColor', '#8B0000');
```

Uses React DevTools `overrideProps` (DEV only) to re-render that sheet with one prop changed — a real native props update. Rules:

- One override per tool call. Overrides issued in parallel calls land in the same JS tick and clobber each other — only the last one sticks.
- Overrides reset as soon as the parent re-renders, and `present()`/`dismiss()` re-render it. Set overrides after the sheet has settled, and compare against `__ts.insts[label].props.<prop>` before concluding native is stale.
- Clear a prop with `null`, not `undefined` (`__ts.set(label, 'dimColor', null)`).

Good observables: `backgroundColor` and `cornerRadius` — the screenshot shows exactly whether the props update landed (on iOS they apply only through `setupSheetProps` / `applySheetPropsUpdate`). `grabber: false` did not hide the basic sheet's grabber (it sets `grabberOptions`), so don't use it as the observable. `detents` overrides also work (`['auto', 1]`) and drive in-place settles without editing the example.

## Hitting a narrow native window

JS timers race argent tool-call latency (seconds between calls), so don't time with `setTimeout` against a gesture. Tie the change to the gesture itself:

```js
__ts.armDrag('unnamed["auto"]', 'backgroundColor', [
  '#440044',
  '#004444',
  '#444400',
  '#660000',
  '#003366',
]);
```

Then drag with `gesture-custom` (interpolated), e.g. a cancelled swipe-to-dismiss: Down on the sheet → Move far down → hold ~800 ms → Move back up → Up. Every `onDragChange` changes the prop, so the last change lands mid-gesture. `__ts.disarmDrag()` returns `{ changes, last }`; the sheet must end up showing `last`. Take the screenshot ~1 s after release — the cancel transition has to finish first.

iOS: UIKit only reports `isBeingDismissed` once the drag passes the dismiss threshold; a shallow drag never enters the dismissing state.

## Programmatic present / dismiss / resize

`__ts.insts[label]` is the TrueSheet instance:

```js
(() => {
  const s = __ts.insts['unnamed["auto"]'];
  s.dismiss();
  setTimeout(() => __ts.set('unnamed["auto"]', 'backgroundColor', '#660000'), 100); // mid-dismiss
  setTimeout(() => s.present(), 1500);
  return 'ok';
})();
```

A swipe right after launch is often ignored, so prefer `resize(index)` here to move a sheet to a detent deterministically.

Ordering on the main queue matters when combining a prop change with a TurboModule call (seen on iOS):

- same JS tick (`set(...)` then `s.resize(1)`): the native call is queued **before** the Fabric mount, so it runs against the old props on HEAD too;
- `setTimeout(..., 0)` (like a `useEffect`): the call runs after the mount — the realistic case to test.

## Props a re-render would reset

To keep a prop overridden through re-renders (e.g. make `main`, which is `dismissible={false}`, reach the native dismiss path), wrap the instance's `props`:

```js
(() => {
  const s = __ts.insts['main["peek","auto",1]'];
  let props = s.props;
  Object.defineProperty(s, 'props', {
    configurable: true,
    get: () => ({ ...props, dismissible: true }),
    set: (next) => (props = next),
  });
  return 'ok';
})();
```

This changes only what the JS component reads (`this.props`), not the native props.
