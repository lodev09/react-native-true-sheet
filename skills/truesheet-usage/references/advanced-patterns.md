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
- [Migration v2 → v3](#migration-v2--v3)

---

## React Navigation

Use `createTrueSheetNavigator()` to treat sheets as screens in your navigation tree.

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

### Screen options

All TrueSheet props are available as screen `options`, plus:

| Option | Type | Description |
|--------|------|-------------|
| `detentIndex` | `number` | Initial detent when the sheet presents (default: `0`) |
| `reanimated` | `boolean` | Enable worklet-based position tracking |
| `positionChangeHandler` | `worklet` | Worklet called on position changes (requires `reanimated: true`) |

### `useTrueSheetNavigation()` hook

```tsx
const navigation = useTrueSheetNavigation()

navigation.resize(1)         // resize to a detent
navigation.goBack()          // dismiss current sheet

// Dynamic options
navigation.setOptions({
  footer: <UpdatedFooter />,
})
```

### Screen event listeners

```tsx
navigation.addListener('sheetDidPresent', (e) => {})
navigation.addListener('sheetDetentChange', (e) => {})
```

Available events: `sheetWillPresent`, `sheetDidPresent`, `sheetWillDismiss`, `sheetDidDismiss`, `sheetDetentChange`, `sheetDragBegin`, `sheetDragChange`, `sheetDragEnd`, `sheetPositionChange`.

### Web caveat

On web, navigation-based sheets need `useFocusEffect` to trigger present/dismiss since the native lifecycle differs.

---

## Expo Router

Use `withLayoutContext` to create an Expo Router-compatible layout:

```tsx
// app/sheet/_layout.tsx
import { withLayoutContext } from 'expo-router'
import { createTrueSheetNavigator } from '@lodev09/react-native-true-sheet/navigation'

const { Navigator } = createTrueSheetNavigator()
const Sheet = withLayoutContext(Navigator)

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

Static methods (`TrueSheet.present`, etc.) don't work on web. Use the hook:

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

**Disable per-sheet:**
```tsx
<TrueSheet backgroundColor="#ffffff">
```

**Disable app-wide (Info.plist):**
```xml
<key>UIDesignRequiresCompatibility</key>
<true/>
```

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

jest.mock('@lodev09/react-native-true-sheet/reanimated', () =>
  require('@lodev09/react-native-true-sheet/reanimated/mock')
)
```

### Jest config

```json
{
  "setupFilesAfterSetup": ["<rootDir>/jest.setup.js"],
  "transformIgnorePatterns": [
    "node_modules/(?!(react-native|@react-native|@lodev09/react-native-true-sheet)/)"
  ]
}
```

### Available mocks

- `TrueSheet`, `TrueSheetProvider`, `useTrueSheet`
- `createTrueSheetNavigator`, `useTrueSheetNavigation`
- `ReanimatedTrueSheet`, `ReanimatedTrueSheetProvider`, `useReanimatedTrueSheet`

Static methods are jest mocks, so you can assert on them:

```tsx
expect(TrueSheet.present).toHaveBeenCalledWith('my-sheet', 0)
```

---

## Migration v2 → v3

### Requirements

- React Native >= 0.76 (Expo SDK 52+)
- New Architecture enabled (default in RN 0.76+)

### Prop renames

| v2 | v3 |
|----|----|
| `sizes` | `detents` |
| `initialIndex` | `initialDetentIndex` |
| `initialIndexAnimated` | `initialDetentAnimated` |
| `FooterComponent` | `footer` |
| `onPresent` | `onDidPresent` |
| `onDismiss` | `onDidDismiss` |
| `onSizeChange` | `onDetentChange` |
| `dimmedIndex` | `dimmedDetentIndex` |

### Removed props

| v2 prop | What to do in v3 |
|---------|-----------------|
| `grabberProps` | Use `grabber: true` with `grabberOptions` |
| `scrollRef` | Use `scrollable: true` — auto-detected |
| `contentContainerStyle` | No longer needed |
| `edgeToEdge` | Auto-detected on Android |

### Detent value format

```tsx
// v2
sizes={["50%", "80%", "100%"]}

// v3
detents={[0.5, 0.8, 1]}
```

### Behavioral changes

- **`backgroundColor`** defaults to system (transparent on iOS) instead of white
- **`backgroundBlur`** now applies over `backgroundColor` instead of replacing it
- **Safe area** is handled natively — the sheet is taller than the detent fraction to account for the bottom inset. Footer components should add bottom safe area padding themselves
- **Event system** expanded: lifecycle events now have will/did pairs, plus focus/blur events for stacking
