# Web (mobile Safari / Chrome)

The web sheet (`src/TrueSheet.web.tsx`, vendored vaul in `src/web/vaul`, keyboard fitting in `src/web/keyboard.ts`) is JS only: no build, Metro hot-swaps `src/` edits. Test it in real mobile browsers — iOS Simulator Safari and Android emulator Chrome — since touch drag, the soft keyboard, and the visual viewport behave differently on desktop.

## Serve and open

```sh
yarn expo web --port 8090     # background command, max timeout
```

- Port 8090 because the bare Metro usually holds 8081. Don't set `CI=1`: it disables file watching, so new routes and edits aren't picked up.
- iOS Safari: `open-url http://localhost:8090/<route>`. Append `?r=N` (new N each time) to force a fresh load.
- Android Chrome: `adb reverse tcp:8090 tcp:8090` first, then `open-url` the same URL. On first run tap "Stay signed out", then "No thanks".
- Routes (`example/expo/app`): `/` is the same shared MapScreen and sheets as the bare app; also `/sheet` (Sheet Navigator), `/standard`, `/modal`, `/test-stack`, `/repro`.

## Reading the page

The runtime hooks don't apply: `scripts/sheet-hooks.js` needs class instances (web `TrueSheet` is a function component), and argent's `debugger-*` tools don't attach to mobile browser tabs.

- `describe`: Chrome's tree exposes web text fields and buttons, so prefer it. Safari's exposes RN-web `Text` and inputs with an `accessibilityLabel`, little else.
- MapScreen's on-screen log lines (latest events, fading) show in both trees.
- For hard numbers, render a temporary live readout in the route under test and read it from `describe`:

  ```tsx
  const [probe, setProbe] = useState('');
  useEffect(() => {
    const id = setInterval(() => {
      const vv = window.visualViewport!;
      const drawer =
        document.activeElement?.closest('[data-vaul-drawer]') ??
        Array.from(document.querySelectorAll('[data-vaul-drawer]'))
          .reverse()
          .find((d) => d.getBoundingClientRect().height > 0);
      const r = drawer?.getBoundingClientRect();
      setProbe(
        `inner=${innerHeight} client=${document.documentElement.clientHeight} scrollY=${Math.round(scrollY)} ` +
          `vv=${Math.round(vv.height)}@${Math.round(vv.offsetTop)} scale=${vv.scale.toFixed(2)} ` +
          `drawer=${Math.round(r?.top ?? -1)}..${Math.round(r?.bottom ?? -1)}`
      );
    }, 250);
    return () => clearInterval(id);
  }, []);
  // <Text accessibilityLabel={probe}>{probe}</Text>
  ```

- The index route stays mounted under the expo-router Stack, and its peek sheet keeps an open `[data-vaul-drawer]` with a 0 rect. Never take the first match — use the focused element's drawer or the last non-empty one (as above).

## Viewport and keyboard facts

Measured on iOS 27 Safari and Chrome 154 (Pixel_10_Pro_XL):

- Both keep the layout viewport — and every fixed element — full height under the soft keyboard; only `visualViewport.height` shrinks. `documentElement.clientHeight` stays full height.
- Safari: if the focused input is under the keyboard, it scrolls the document (`scrollY` = `vv.offsetTop`, about 349). `innerHeight` then reports `vv.height`, so don't trust it. `getBoundingClientRect` is relative to the visual viewport. The translucent URL pill above the keyboard is outside the visual viewport, so a strip of page showing there is expected.
- Safari auto-zooms inputs with `fontSize` < 16 (`vv.scale` about 1.14, `innerHeight` changes). Give repro inputs `fontSize: 16` to keep the numbers clean.
- Chrome: `inner` = `client` = 864, `vv` = 488 with the keyboard open; it pans the visual viewport (`vv.offsetTop`) to reveal a low input.
- Chrome: a programmatic `focus()` in `onDidPresent` only sometimes opens the keyboard — tap the input instead. Back with the keyboard open only hides the keyboard.

Expected sheet behavior with the keyboard (#920): the sheet's wrapper fits `vv.offsetTop`/`vv.height`, fractional detents still scale against `clientHeight` and cap at the visible height (Android parity), and the focused field is revealed again after the snap settles.

## Evidence and A/B

- Frame analysis works the same on recordings of the browser (frame-analysis.md). The browser's own bars shift the page, so re-pick columns and thresholds from a frame instead of reusing the native targets.
- A/B: swap the `src/` files as in SKILL.md §4 (never `git stash`), then reload with a new `?r=N`.
- Remove the readout probe and any repro edits before finishing.
