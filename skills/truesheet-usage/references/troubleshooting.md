# Troubleshooting

Common issues and fixes when using TrueSheet, organized by symptom.

## Table of Contents

- [Content renders with zero height or gets clipped](#content-renders-with-zero-height-or-gets-clipped)
- [Blank screen after modal dismiss (iOS)](#blank-screen-after-modal-dismiss-ios)
- [Sheet snaps without animation on keyboard dismiss (iOS, RN 0.83–0.85)](#sheet-snaps-without-animation-on-keyboard-dismiss-ios-rn-083085)
- [Gesture handler not working (Android)](#gesture-handler-not-working-android)
- [initialDetentIndex not working from deep link (iOS)](#initialdetentindex-not-working-from-deep-link-ios)
- [Gap above the keyboard](#gap-above-the-keyboard)
- [Doubled bottom padding in footer or scroll content](#doubled-bottom-padding-in-footer-or-scroll-content)
- [Overlays render behind the sheet (Android)](#overlays-render-behind-the-sheet-android)
- [Keyboard hides input](#keyboard-hides-input)
- [Sheet doesn't build (Xcode version)](#sheet-doesnt-build-xcode-version)
- [EAS Build fails](#eas-build-fails)
- [Patched react-native-screens not applied on EAS](#patched-react-native-screens-not-applied-on-eas)

---

## Content renders with zero height or gets clipped

**Symptom:** `flex: 1` children render with zero height, or content taller than the sheet gets clipped.

**Cause:** In v4, the sheet's content lays out naturally — it wraps its children's height like a regular view, instead of filling the sheet.

**Fixes:**

1. **`flex: 1` children collapse** — pass `flex: 1` via the sheet's `style` prop so the content fills the sheet's visible height:
   ```tsx
   <TrueSheet style={{ flex: 1 }} detents={[0.5, 1]}>
     <View style={{ flex: 1 }}>{/* now fills */}</View>
   </TrueSheet>
   ```
2. **Content taller than the sheet gets clipped** — use a ScrollView plugged via `scrollableRef` with `flex: 1` on the sheet's `style`, or size your layout with `flexGrow`, `flexBasis`, or fixed heights.
3. **Still misbehaving?** Move the sheet higher in the component tree — a container may interfere with the sheet's content rendering.

## Blank screen after modal dismiss (iOS)

**Symptom:** Screen goes blank after dismissing a React Native `Modal` when a sheet is also visible.

**Cause:** React Native bug — dismissing a Modal with another view controller presented on top only dismisses the topmost one, leaving the Modal inconsistent. A fix is pending upstream ([PR #55005](https://github.com/facebook/react-native/pull/55005)).

**Fix:** Dismiss the sheet first, then dismiss the Modal:

```tsx
await sheet.current?.dismiss()
setModalVisible(false)
```

## Sheet snaps without animation on keyboard dismiss (iOS, RN 0.83–0.85)

**Symptom:** On React Native 0.83–0.85, the sheet snaps back to its detent without animation when the keyboard is dismissed.

**Cause:** RN 0.83 made `canBecomeFirstResponder` return `YES` on every `RCTViewComponentView`, disrupting `UISheetPresentationController`'s keyboard avoidance animation. Fixed upstream in RN 0.86.

**Fix:** Apply the [react-native patch](https://github.com/lodev09/react-native-true-sheet/blob/main/.yarn/patches/react-native-npm-0.85.3.patch) that gates it behind the `enableImperativeFocus` feature flag. Remove the patch once on 0.86+.

## Gesture handler not working (Android)

**Symptom:** Gestures (swipe, tap) from `react-native-gesture-handler` don't fire inside the sheet.

**Fix:** Wrap sheet content in `GestureHandlerRootView` with `flexGrow: 1`:

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler'

<TrueSheet detents={[0.5, 1]}>
  <GestureHandlerRootView style={{ flexGrow: 1 }}>
    {/* Your gesture-enabled content */}
  </GestureHandlerRootView>
</TrueSheet>
```

Use `flexGrow: 1` instead of `flex: 1` — the sheet's content wraps its natural height by default, so a `flex: 1` child collapses to zero height. Alternatively, pass `flex: 1` via the sheet's `style` prop to fill the sheet.

## initialDetentIndex not working from deep link (iOS)

**Symptom:** `initialDetentIndex` has no effect when the app is opened via a deep link to a modal screen from a cold start.

**Cause:** The view wasn't attached to the correct window during the initial render.

**Fix:** Use `useFocusEffect` to present when the screen gains focus, conditioned on whether the initial present succeeded:

```tsx
import { useFocusEffect } from '@react-navigation/native'

const [didPresent, setDidPresent] = useState(false)

useFocusEffect(
  useCallback(() => {
    if (!didPresent) {
      sheet.current?.present()
    }
  }, [didPresent])
)

<TrueSheet ref={sheet} initialDetentIndex={0} onDidPresent={() => setDidPresent(true)}>
```

## Gap above the keyboard

**Symptom:** A gap appears between the keyboard and the scroll content or footer.

**Cause:** Your content or footer renders its own bottom padding, which stacks on top of the sheet's keyboard inset.

**Fixes:**

- Scroll content: pass a negative `keyboardOffset` in `scrollableOptions` to cancel the padding, e.g. `scrollableOptions={{ keyboardOffset: -insets.bottom }}`.
- Absolute footer: pass a negative `keyboardOffset` in `footerOptions` to tuck the padding behind the keyboard, e.g. `footerOptions={{ position: 'absolute', keyboardOffset: -16 }}`.

## Doubled bottom padding in footer or scroll content

**Symptom:** Extra spacing at the bottom of the footer or the last scroll item.

**Cause:** v4 handles the bottom safe-area inset natively — the footer absorbs it as padding, and a plugged scrollable gets it while the content can scroll. Manual `useSafeAreaInsets()` padding gets applied twice.

**Fix:** Remove manual safe-area padding from the footer and scroll content. To manage it yourself instead, opt out with `scrollableOptions={{ contentInsetAdjustmentBehavior: false }}` (scrollable) or `insetAdjustment="never"` (whole sheet).

## Overlays render behind the sheet (Android)

**Symptom:** Dropdowns, toasts, or dialogs from portal-based libraries render behind the sheet.

**Cause:** The sheet lives in a native `CoordinatorLayout` that sits above the normal React Native view hierarchy.

**Fix:** Render overlays in `FullWindowOverlay` (iOS) or `Modal` (Android). See [Advanced Patterns: Overlays on sheets](./advanced-patterns.md#overlays-on-sheets).

## Keyboard hides input

**Symptom:** TextInput inside the sheet is obscured by the keyboard.

TrueSheet has built-in keyboard avoidance — this usually means something else is wrong:

1. **Don't use `autoFocus`** on TextInputs. Focus the input in `onDidPresent` instead.
2. **Plug the scroll view via `scrollableRef`** — the sheet auto-scrolls to keep the focused input visible. Add `keyboardScrollOffset` for extra spacing:
   ```tsx
   <TrueSheet scrollableRef={scrollableRef} scrollableOptions={{ keyboardScrollOffset: 16 }}>
   ```
3. **Footer behavior**: an **absolute** footer (`footerOptions={{ position: 'absolute' }}`) rises above the keyboard automatically; a **relative** footer (default) stays in the layout flow and is covered by the keyboard until it hides.

## Sheet doesn't build (Xcode version)

**Requirement:** Xcode 26.1+ for Liquid Glass support and latest TrueSheet features.

Check your Xcode version: `xcodebuild -version`

## EAS Build fails

For Expo EAS builds, ensure you're using a build image with Xcode 26.1+:

```json
// eas.json
{
  "build": {
    "production": {
      "ios": {
        "image": "latest"
      }
    }
  }
}
```

## Patched react-native-screens not applied on EAS

**Symptom:** On Expo SDK 56+ EAS builds, the sheet dismisses when navigating (or a full-screen modal fails to present over it), even though it works locally with the [react-native-screens patch](./advanced-patterns.md#navigating-from-sheets) applied.

**Cause:** Expo SDK 56+ ships `react-native-screens` as a precompiled XCFramework on EAS — patches applied via `patch-package`/`pnpm patch`/Yarn `patches` are silently ignored, while local builds compile from source.

**Fix:** Build from source. Either disable precompiled modules per profile in `eas.json`:

```json
{
  "build": {
    "development": { "env": { "EXPO_USE_PRECOMPILED_MODULES": "0" } },
    "production": { "env": { "EXPO_USE_PRECOMPILED_MODULES": "0" } }
  }
}
```

Or opt out only `react-native-screens` in `package.json` (keeps everything else precompiled):

```json
{
  "expo": {
    "autolinking": {
      "ios": { "buildFromSource": ["react-native-screens"] }
    }
  }
}
```

Avoid `ios.buildReactNativeFromSource: true` — it rebuilds RN core and is much slower.
