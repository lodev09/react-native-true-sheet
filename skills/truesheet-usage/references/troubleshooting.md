# Troubleshooting

Common issues and fixes when using TrueSheet, organized by symptom.

## Table of Contents

- [Blank screen after modal dismiss (iOS)](#blank-screen-after-modal-dismiss-ios)
- [Gesture handler not working (Android)](#gesture-handler-not-working-android)
- [initialDetentIndex not working from deep link (iOS)](#initialdetentindex-not-working-from-deep-link-ios)
- [Weird layout or render glitches](#weird-layout-or-render-glitches)
- [FlatList scrollToEnd not working](#flatlist-scrolltoend-not-working)
- [Overlays render behind the sheet (Android)](#overlays-render-behind-the-sheet-android)
- [Keyboard hides input](#keyboard-hides-input)
- [Sheet doesn't build (Xcode version)](#sheet-doesnt-build-xcode-version)
- [EAS Build fails](#eas-build-fails)

---

## Blank screen after modal dismiss (iOS)

**Symptom:** Screen goes blank after dismissing a React Native `Modal` when a sheet is also visible.

**Cause:** React Native bug — dismissing a Modal while a sheet is on top can blank the underlying view.

**Fix:** Dismiss the sheet first, then dismiss the Modal:

```tsx
await sheet.current?.dismiss()
setModalVisible(false)
```

## Gesture handler not working (Android)

**Symptom:** Gestures (swipe, tap) from `react-native-gesture-handler` don't fire inside the sheet.

**Fix:** Wrap sheet content in `GestureHandlerRootView` with `flexGrow: 1` (not `flex: 1`):

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler'

<TrueSheet detents={[0.5, 1]}>
  <GestureHandlerRootView style={{ flexGrow: 1 }}>
    {/* Your gesture-enabled content */}
  </GestureHandlerRootView>
</TrueSheet>
```

The Android sheet renders in its own `CoordinatorLayout`, which needs a fresh gesture root.

## initialDetentIndex not working from deep link (iOS)

**Symptom:** `initialDetentIndex` has no effect when the app is opened via a deep link from a cold start.

**Cause:** On iOS, the sheet component may mount before the navigation tree is ready. `initialDetentIndex` fires too early.

**Fix:** Use `useFocusEffect` to present the sheet when the screen actually gains focus:

```tsx
import { useFocusEffect } from '@react-navigation/native'

useFocusEffect(
  useCallback(() => {
    sheet.current?.present(1)
  }, [])
)
```

## Weird layout or render glitches

**Symptom:** Content appears squished, overlapping, or sized incorrectly inside the sheet.

**Fixes:**

1. **Minimize `flex: 1`** — Sheets have a defined height from detents. `flex: 1` inside a sheet can cause unexpected stretching. Use `flexGrow` or fixed `height` instead.
2. **Move the sheet higher in the component tree** — If the sheet is deeply nested, it may inherit layout constraints that interfere with its sizing.
3. **Use `header` and `footer` props** — Don't manually position fixed elements with `position: 'absolute'`. The native header/footer system handles layout math correctly.

## FlatList scrollToEnd not working

**Symptom:** `scrollToEnd()` on a FlatList inside a `scrollable` TrueSheet doesn't scroll to the true end.

**Cause:** The native scroll container modifies the frame, and `scrollToEnd()` uses JS-side content metrics that don't account for this.

**Fix:** Use `scrollToOffset` with a large value:

```tsx
flatListRef.current?.scrollToOffset({ offset: 99999, animated: true })
```

## Overlays render behind the sheet (Android)

**Symptom:** Dropdowns, toasts, or dialogs from portal-based libraries render behind the sheet.

**Cause:** The sheet lives in a native `CoordinatorLayout` that sits above the normal React Native view hierarchy.

**Fix:** Render overlays in `FullWindowOverlay` (iOS) or `Modal` (Android). See [Advanced Patterns: Overlays on sheets](./advanced-patterns.md#overlays-on-sheets).

## Keyboard hides input

**Symptom:** TextInput inside the sheet is obscured by the keyboard.

TrueSheet has built-in keyboard avoidance — this usually means something else is wrong:

1. **Don't use `autoFocus`** on TextInputs. Focus the input in `onDidPresent` instead.
2. **For scrollable sheets**, add `keyboardScrollOffset` for extra padding:
   ```tsx
   <TrueSheet scrollable scrollableOptions={{ keyboardScrollOffset: 16 }}>
   ```
3. **Footer repositions automatically** above the keyboard — no extra work needed.

## Sheet doesn't build (Xcode version)

**Requirement:** Xcode 26.1+ for Liquid Glass support and latest TrueSheet features.

Check your Xcode version: `xcodebuild -version`

## EAS Build fails

For Expo EAS builds, ensure you're using a recent enough build image:

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

This ensures Xcode 26.1+ is available during the build.
