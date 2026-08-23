# Advanced Patterns

Deeper integration guides for Navigation, Reanimated, Web, Side sheets, Liquid Glass, Jest, and Migration.

## Table of Contents

- [React Navigation](#react-navigation)
- [Expo Router](#expo-router)
- [Reanimated](#reanimated)
- [Web](#web)
- [Side sheets](#side-sheets)
- [Liquid Glass (iOS 26+)](#liquid-glass-ios-26)
- [Overlays on sheets](#overlays-on-sheets)
- [Edge-to-edge (Android)](#edge-to-edge-android)
- [Jest testing](#jest-testing)
- [Migration v3 → v4](#migration-v3--v4)

---

## React Navigation

Use `createTrueSheetNavigator()` to treat sheets as screens in your navigation tree. The first screen (or `initialRouteName`) is the base content; other screens present as sheets.

### Requirements

The navigator is built on `standard-navigation`, so one implementation works with both React Navigation and Expo Router. Install the optional peers:

```sh
yarn add @react-navigation/native@^7.3.0 standard-navigation
```

### Setup

```tsx
import { createTrueSheetNavigator } from '@lodev09/react-native-true-sheet/navigation'

const Sheet = createTrueSheetNavigator()

function App() {
  return (
    <NavigationContainer>
      <Sheet.Navigator>
        {/* First screen = base content behind the sheet */}
        <Sheet.Screen name="Home" component={HomeScreen} />

        {/* Other screens present as sheets */}
        <Sheet.Screen
          name="Details"
          component={DetailsSheet}
          options={{
            detents: ['auto', 1],
            cornerRadius: 16,
            grabber: true,
          }}
        />
      </Sheet.Navigator>
    </NavigationContainer>
  )
}
```

To present sheets from anywhere, wrap your root stack: `<Sheet.Screen name="Root" component={RootStack} />` plus sheet screens as siblings.

### Static API

React Navigation's [static configuration](https://reactnavigation.org/docs/static-configuration) is supported via `createTrueSheetScreen`:

```tsx
import {
  createTrueSheetNavigator,
  createTrueSheetScreen,
} from '@lodev09/react-native-true-sheet/navigation'

const Sheet = createTrueSheetNavigator({
  screens: {
    Main: MainScreen,
    Details: createTrueSheetScreen({
      screen: DetailsSheet,
      options: { detents: ['auto', 1] },
    }),
  },
})
```

### Screen options

All TrueSheet props are available as screen `options`, plus:

| Option | Type | Description |
|--------|------|-------------|
| `detentIndex` | `number` | Initial detent when the sheet presents (default: `0`) |
| `reanimated` | `boolean` | Enable worklet-based position events for this screen |
| `positionChangeHandler` | `function` | Callback for position change events. Must be a worklet when `reanimated: true` |

The reanimated integration is lazy-loaded — screens without `reanimated: true` don't require `react-native-reanimated`.

### `useTrueSheetNavigation()` hook

```tsx
const navigation = useTrueSheetNavigation()

navigation.resize(1)         // resize to a detent
navigation.goBack()          // dismiss current sheet

// Dynamic options — any TrueSheet prop (header, footer, grabber, dismissible, ...)
navigation.setOptions({
  footer: <UpdatedFooter />,
})
```

### Screen event listeners

```tsx
navigation.addListener('sheetDidPresent', (e) => {
  console.log(e.data.index)
})
```

Also available as `screenListeners` on the navigator or `listeners` on a screen. Events: `sheetWillPresent`, `sheetDidPresent`, `sheetWillDismiss`, `sheetDidDismiss`, `sheetDetentChange`, `sheetDragBegin`, `sheetDragChange`, `sheetDragEnd`, `sheetPositionChange`.

### Navigating from sheets

Sheets remain visible when presenting screens on top — `navigation.navigate('SomeScreen')` works directly, no dismissing first. This requires a [patch to react-native-screens](https://github.com/lodev09/react-native-true-sheet/blob/main/.yarn/patches/react-native-screens-npm-4.25.2.patch) (see [PR #3415](https://github.com/software-mansion/react-native-screens/pull/3415)). On Expo SDK 56+ EAS builds the patch is silently dropped — see [Troubleshooting](./troubleshooting.md#patched-react-native-screens-not-applied-on-eas).

### Web caveat

Sheet visibility during navigation relies on `react-native-screens` detection, which isn't supported on web. Use `useFocusEffect` to present/dismiss manually when the screen gains/loses focus.

---

## Expo Router

v4 ships a ready-to-use `Sheet` layout via the `/navigation/expo-router` entry point — no `withLayoutContext` wrapper and no `@react-navigation/*` install needed. Requires Expo SDK 57+ and the `standard-navigation` optional peer:

```sh
yarn add standard-navigation
```

```tsx
// app/_layout.tsx
import { Sheet } from '@lodev09/react-native-true-sheet/navigation/expo-router'

export default function SheetLayout() {
  return (
    <Sheet>
      <Sheet.Screen name="index" />
      <Sheet.Screen
        name="details"
        options={{ detents: ['auto', 1], cornerRadius: 16 }}
      />
    </Sheet>
  )
}
```

Inside sheet screens, import the hook from the **same entry point**:

```tsx
import { useTrueSheetNavigation } from '@lodev09/react-native-true-sheet/navigation/expo-router'
```

All navigator features (screen options, reanimated, dynamic header/footer via `setOptions`, listeners) apply here too.

---

## Reanimated

Requires `react-native-reanimated` >=4 and `react-native-worklets` (mandatory dependency of Reanimated 4+). Both packages are optional TrueSheet peer dependencies — you only need them if you use TrueSheet's Reanimated features.

### Provider setup

```tsx
import { ReanimatedTrueSheetProvider } from '@lodev09/react-native-true-sheet/reanimated'

function App() {
  return (
    <ReanimatedTrueSheetProvider>
      <YourApp />
    </ReanimatedTrueSheetProvider>
  )
}
```

### Using `ReanimatedTrueSheet`

```tsx
import { ReanimatedTrueSheet } from '@lodev09/react-native-true-sheet/reanimated'

<ReanimatedTrueSheet ref={sheetRef} detents={[0.3, 0.6, 1]}>
  <Content />
</ReanimatedTrueSheet>
```

Note: `onPositionChange` on `ReanimatedTrueSheet` runs on the UI thread — if you override it, add the `'worklet'` directive to your handler.

### Animated values

Access shared values from anywhere inside the provider:

```tsx
import { useReanimatedTrueSheet } from '@lodev09/react-native-true-sheet/reanimated'

function AnimatedBackdrop() {
  const { animatedPosition, animatedIndex, animatedDetent } = useReanimatedTrueSheet()

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(animatedIndex.value, [0, 1], [0, 0.5], Extrapolation.CLAMP),
  }))

  return <Animated.View style={[StyleSheet.absoluteFill, style]} />
}
```

| Value | Type | Description |
|-------|------|-------------|
| `animatedPosition` | `SharedValue<number>` | Y position relative to screen top |
| `animatedIndex` | `SharedValue<number>` | Continuous float (0.5 = between detent 0 and 1) |
| `animatedDetent` | `SharedValue<number>` | Current detent value (0–1) |

---

## Web

### Installation

Web needs the underlying dialog primitives, declared as optional peer dependencies:

```sh
yarn add @radix-ui/react-dialog @radix-ui/react-presence
```

### Provider (required on web, pass-through on native)

```tsx
import { TrueSheetProvider } from '@lodev09/react-native-true-sheet'

function App() {
  return (
    <TrueSheetProvider>
      <YourApp />
    </TrueSheetProvider>
  )
}
```

### Control via hook

Static methods (`TrueSheet.present`, etc.) don't work on web. Use refs, or the hook:

```tsx
const { present, dismiss, dismissAll, dismissStack, resize } = useTrueSheet()

await present('my-sheet')
await dismiss('my-sheet')
```

### Detached mode (floating card)

```tsx
<TrueSheet detached detachedOffset={24} detents={[0.5]}>
  <CardContent />
</TrueSheet>
```

---

## Side sheets

Anchor a sheet to the left or right edge. Useful for tablet layouts or navigation drawers.

```tsx
<TrueSheet
  anchor="left"
  detents={['auto', 1]}
  maxContentWidth={400}
  anchorOffset={16}
>
  <SideMenu />
</TrueSheet>
```

- On iOS, the system controls the side margins via `sourceView`
- On phones in portrait, anchor is ignored — the sheet is always full-width
- `anchorOffset` applies on Android and Web only

---

## Liquid Glass (iOS 26+)

Liquid Glass is the frosted glass visual effect introduced in iOS 26. It's automatic — no configuration needed.

**When it activates:** iOS 26+ with no `backgroundColor` and no `backgroundBlur` set.

**Disable per-sheet (iOS 26.1+):** set `backgroundColor` and/or `backgroundBlur`:
```tsx
<TrueSheet backgroundColor="#ffffff">
```

**Disable app-wide (Info.plist):**
```xml
<key>UIDesignRequiresCompatibility</key>
<true/>
```

Or via Expo config: `expo.ios.infoPlist.UIDesignRequiresCompatibility: true`. This disables Liquid Glass for the entire app, not just sheets.

---

## Overlays on sheets

Portal-based UI elements (dialogs, toasts, dropdown menus) may render behind the sheet on Android because the sheet lives in its own `CoordinatorLayout`.

**Solution:** Use `FullWindowOverlay` (iOS) or `Modal` (Android):

```tsx
import { Platform, Modal } from 'react-native'
import { FullWindowOverlay } from 'react-native-screens'

const Overlay = Platform.select({
  ios: FullWindowOverlay,
  default: Modal,
})

<Overlay visible={visible} transparent>
  <YourDialogContent />
</Overlay>
```

---

## Edge-to-edge (Android)

TrueSheet auto-detects edge-to-edge when enabled. To enable:

```properties
# android/gradle.properties
edgeToEdgeEnabled=true
```

Android 16+ will enable this automatically. No TrueSheet configuration needed.

---

## Jest testing

### Mock setup

```js
// jest.setup.js
jest.mock('@lodev09/react-native-true-sheet', () =>
  require('@lodev09/react-native-true-sheet/mock')
)

jest.mock('@lodev09/react-native-true-sheet/navigation', () =>
  require('@lodev09/react-native-true-sheet/navigation/mock')
)

jest.mock('@lodev09/react-native-true-sheet/navigation/expo-router', () =>
  require('@lodev09/react-native-true-sheet/navigation/expo-router/mock')
)

jest.mock('@lodev09/react-native-true-sheet/reanimated', () =>
  require('@lodev09/react-native-true-sheet/reanimated/mock')
)
```

### Jest config

```json
{
  "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"],
  "transformIgnorePatterns": [
    "node_modules/(?!(react-native|@react-native|@lodev09/react-native-true-sheet)/)"
  ]
}
```

`transformIgnorePatterns` is required because the mock files use ESM syntax.

### Available mocks

- `/mock`: `TrueSheet` (mocked `present`/`dismiss`/`resize`), `TrueSheetProvider`, `useTrueSheet`
- `/navigation/mock`: `createTrueSheetNavigator`, `createTrueSheetScreen`, `TrueSheetActions`, `useTrueSheetNavigation`
- `/navigation/expo-router/mock`: `Sheet` (pass-through with `Screen` and `Protected`), `TrueSheetActions`, `useTrueSheetNavigation`
- `/reanimated/mock`: `ReanimatedTrueSheet`, `ReanimatedTrueSheetProvider`, `useReanimatedTrueSheet`, `useReanimatedPositionChangeHandler`

Static methods are jest mocks, so you can assert on them:

```tsx
expect(TrueSheet.present).toHaveBeenCalledWith('my-sheet', 0)
```

All mocked methods return resolved Promises — `await` them in tests, and `jest.clearAllMocks()` between tests.

---

## Migration v3 → v4

v4 rewrites the layout engine — the sheet lays out synchronously per detent with Yoga owning all frames. Upgrading from v2? Migrate to v3 first (prop renames: `sizes`→`detents`, `onPresent`→`onDidPresent`, `onSizeChange`→`onDetentChange`, `FooterComponent`→`footer`, percentage strings→fractions).

### Requirements

- React Native >= 0.82 (Expo SDK 55+), New Architecture enabled
- Sheet Navigator: `@react-navigation/native` 7.3+ and `standard-navigation`
- Expo Router: Expo SDK 57+ and `standard-navigation`

### 1. `scrollable` → `scrollableRef`

```tsx
// ❌ v3
<TrueSheet scrollable detents={[0.5, 1]}>
  <ScrollView>{/* ... */}</ScrollView>
</TrueSheet>

// ✅ v4 — plug the scroll view, bound it with flex: 1
<TrueSheet scrollableRef={scrollableRef} style={{ flex: 1 }} detents={[0.5, 1]}>
  <ScrollView ref={scrollableRef}>{/* ... */}</ScrollView>
</TrueSheet>

// ✅ v4 — 'auto' now works with scrollables, no flex needed
<TrueSheet scrollableRef={scrollableRef} detents={['auto']}>
  <ScrollView ref={scrollableRef}>{/* ... */}</ScrollView>
</TrueSheet>
```

### 2. Content lays out naturally

Content wraps its children's height instead of filling the sheet. If your layout relied on filling (spacers, centered content, bounded scroll views), pass `flex: 1` via the sheet's `style` prop.

### 3. Footer is relative by default

The footer now takes space below the content (still pinned to the bottom edge) and counts toward the `'auto'` detent. To restore the v3 floating behavior:

```tsx
<TrueSheet footer={<MyFooter />} footerOptions={{ position: 'absolute' }}>
```

`footerOptions.keyboardOffset` only applies to absolute footers — a relative footer stays behind the keyboard.

### 4. Safe-area padding is now native

- The footer absorbs the bottom safe-area inset — remove manual `useSafeAreaInsets()` padding from footers.
- A plugged scrollable gets the bottom inset natively while it can scroll — remove manual padding, or opt out with `scrollableOptions={{ contentInsetAdjustmentBehavior: false }}`.

### 5. Navigation entry points

- React Navigation: install `standard-navigation`, bump `@react-navigation/native` to 7.3+. API is unchanged. Static API now available via `createTrueSheetScreen`.
- Expo Router: replace the `withLayoutContext` wrapper with the `Sheet` layout from `/navigation/expo-router`, and import `useTrueSheetNavigation` from that entry point.

### New in v4

- `'auto'` detent works with scrollables
- `'peek'` detent + `TrueSheetPeek` component
- `headerOptions` (floating header)
- `accessibilityOptions`
- Synchronous per-detent layout — flex layouts track the sheet edge frame-by-frame while dragging
