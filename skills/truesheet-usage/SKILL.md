---
name: truesheet-usage
description: >-
  Consumer-side guide for integrating @lodev09/react-native-true-sheet into a React Native app.
  Use this skill whenever the user wants to add, configure, control, or debug a bottom sheet using TrueSheet —
  including ref-based sheets, named global sheets, web support with TrueSheetProvider/useTrueSheet,
  React Navigation or Expo Router sheet flows, Reanimated-driven animations, scrolling content,
  stacking, headers/footers, detents, side sheets, keyboard handling, dimming, liquid glass,
  and Jest testing. Also use when the user is migrating from v2 to v3, troubleshooting layout or
  gesture issues, or asking about any TrueSheet prop, event, or method — even if they don't
  mention "TrueSheet" by name but describe a bottom sheet in a React Native context.
---

# TrueSheet Consumer Guide

Use this skill to produce correct, idiomatic code for apps that consume `@lodev09/react-native-true-sheet`. It covers choosing the right integration pattern, applying the public API correctly, and avoiding platform-specific pitfalls.

## Quick Start

The simplest sheet: a ref, a button, and some content.

```tsx
import { useRef } from 'react'
import { Button, Text, View } from 'react-native'
import { TrueSheet } from '@lodev09/react-native-true-sheet'

export function App() {
  const sheet = useRef<TrueSheet>(null)

  return (
    <View>
      <Button title="Open" onPress={() => sheet.current?.present()} />
      <TrueSheet ref={sheet} detents={['auto']} cornerRadius={24} grabber>
        <View style={{ padding: 16 }}>
          <Text>Hello from the sheet</Text>
          <Button title="Close" onPress={() => sheet.current?.dismiss()} />
        </View>
      </TrueSheet>
    </View>
  )
}
```

## Choose the Right Control Pattern

Pick one based on where the trigger lives relative to the sheet and which platforms you target.

| Pattern | When to use | Platform |
|---------|------------|----------|
| **Ref** | Trigger and sheet in the same component | All |
| **Named + global methods** | Trigger is far from the sheet (different screen, deep in tree) | Native only |
| **`TrueSheetProvider` + `useTrueSheet()`** | Web support needed, or you want hook-based control | All (required on web) |
| **`createTrueSheetNavigator()`** | Sheets are part of a navigation flow | All |
| **`ReanimatedTrueSheet`** | You need animated values synced to sheet position | All |

### Ref-based

Already shown in Quick Start. Use `present()`, `dismiss()`, `resize(index)` on the ref.

### Named sheet with global methods (native only)

When the trigger is far from where the sheet renders:

```tsx
// Somewhere in the tree
<TrueSheet name="profile" detents={['auto', 1]}>
  <ProfileContent />
</TrueSheet>

// Anywhere else (native only)
await TrueSheet.present('profile')
await TrueSheet.dismiss('profile')
await TrueSheet.resize('profile', 1)
await TrueSheet.dismissAll()
```

Every `name` must be unique. Static methods don't exist on web — use the provider pattern instead.

### Web control with provider

Wrap your app with `TrueSheetProvider` (on native this is a pass-through with zero overhead):

```tsx
import { TrueSheet, TrueSheetProvider, useTrueSheet } from '@lodev09/react-native-true-sheet'

function Toolbar() {
  const { present, dismiss } = useTrueSheet()
  return <Button title="Open" onPress={() => present('settings')} />
}

export function App() {
  return (
    <TrueSheetProvider>
      <Toolbar />
      <TrueSheet name="settings" detents={[0.5, 1]}>
        <SettingsContent />
      </TrueSheet>
    </TrueSheetProvider>
  )
}
```

### Navigation (React Navigation / Expo Router)

See [advanced patterns reference](./references/advanced-patterns.md#react-navigation) for full setup with `createTrueSheetNavigator`, Expo Router layouts, screen options, and `useTrueSheetNavigation`.

### Reanimated

See [advanced patterns reference](./references/advanced-patterns.md#reanimated) for `ReanimatedTrueSheet`, `ReanimatedTrueSheetProvider`, and animated values (`animatedPosition`, `animatedIndex`, `animatedDetent`).

## Detents

Detents define the heights the sheet can snap to. You get up to **3 detents**, sorted smallest to largest.

| Value | Meaning |
|-------|---------|
| `'auto'` | Size to fit the content (iOS 16+, Android, Web) |
| `0` – `1` | Fraction of the screen height |

```tsx
// Content-sized sheet
<TrueSheet detents={['auto']} />

// Half and full screen
<TrueSheet detents={[0.5, 1]} />

// Three stops: peek, half, full
<TrueSheet detents={[0.25, 0.5, 1]} />
```

**The one rule you can't break:** never combine `'auto'` with `scrollable`. Auto-sizing needs to measure the full content, but a scrollable sheet clips it — they're fundamentally incompatible. Use fractional detents for scrollable sheets.

## Common Recipes

### Scrollable content

```tsx
<TrueSheet detents={[0.5, 1]} scrollable cornerRadius={24} grabber>
  <ScrollView>
    {items.map(item => <ItemRow key={item.id} item={item} />)}
  </ScrollView>
</TrueSheet>
```

- The `scrollable` prop auto-detects ScrollView/FlatList up to 2 levels deep
- On iOS, scrolling to top expands to next detent — disable with `scrollableOptions={{ scrollingExpandsSheet: false }}`
- On Android, nested scrolling is handled automatically

### Fixed header and footer

```tsx
<TrueSheet
  detents={[0.5, 1]}
  scrollable
  header={
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Title</Text>
    </View>
  }
  footer={<BottomActions />}
>
  <ScrollView>{/* ... */}</ScrollView>
</TrueSheet>
```

Use the `header` and `footer` props — they render in native container views, so the layout math is handled for you. Don't fake it with absolute positioning.

### Non-dismissible confirmation

```tsx
<TrueSheet
  ref={sheet}
  detents={['auto']}
  dismissible={false}
  draggable={false}
  dimmed
  grabber={false}
>
  <View style={{ padding: 24 }}>
    <Text>Are you sure?</Text>
    <Button title="Confirm" onPress={handleConfirm} />
    <Button title="Cancel" onPress={() => sheet.current?.dismiss()} />
  </View>
</TrueSheet>
```

### iOS blur background

```tsx
<TrueSheet detents={['auto']} backgroundBlur="system-material">
  <View style={{ padding: 16 }}>
    <Text>Blurred sheet</Text>
  </View>
</TrueSheet>
```

Fine-tune with `blurOptions={{ intensity: 80, interaction: true }}`. Blur is iOS-only.

### Present on mount

```tsx
<TrueSheet detents={['auto', 1]} initialDetentIndex={0} initialDetentAnimated>
  <WelcomeContent />
</TrueSheet>
```

### Dimming control

```tsx
// No dimming (allows background interaction)
<TrueSheet dimmed={false} detents={['auto']} />

// Dim only above a certain detent
<TrueSheet detents={['auto', 0.7, 1]} dimmedDetentIndex={1} />
```

### Resize programmatically

`resize()` takes a **detent index**, not a value:

```tsx
const sheet = useRef<TrueSheet>(null)

// detents={[0.3, 0.6, 1]}
await sheet.current?.resize(2) // expands to full (index 2)
```

## Rules That Save Debugging Time

1. **Max 3 detents**, sorted smallest → largest.
2. **Never `'auto'` + `scrollable`** — they're incompatible.
3. **`resize()` takes an index**, not a fraction. `resize(1)` means "go to the second detent."
4. **Sheet names must be unique** across your entire app.
5. **Static methods are native-only** — use `useTrueSheet()` on web.
6. **Don't use `autoFocus` on TextInputs** inside sheets. Focus in `onDidPresent` instead:
   ```tsx
   <TrueSheet onDidPresent={() => inputRef.current?.focus()}>
   ```
7. **Use `flexGrow: 1`** (not `flex: 1`) inside `GestureHandlerRootView` on Android.
8. **Dismiss sheets before closing Modals** on iOS — React Native has a bug where dismissing a Modal while a sheet is visible causes a blank screen.
9. **Use `header`/`footer` props** for fixed chrome — don't reach for absolute positioning.
10. **Liquid Glass** is automatic on iOS 26+. Set `backgroundColor` to disable it per-sheet, or add `UIDesignRequiresCompatibility` to Info.plist to disable app-wide.

## Platform Differences at a Glance

| Feature | iOS | Android | Web |
|---------|-----|---------|-----|
| `'auto'` detent | iOS 16+ | Yes | Yes |
| `backgroundBlur` | Yes | No | No |
| Liquid Glass | iOS 26+ | No | No |
| Static global methods | Yes | Yes | No (use provider) |
| `scrollable` | Yes | Yes | No |
| `anchor` / side sheets | System-controlled margins | `anchorOffset` prop | `anchorOffset` prop |
| `pageSizing` (iPad) | iOS 17+ | N/A | N/A |
| `detached` mode | No | No | Yes |
| Edge-to-edge | N/A | Auto-detected | N/A |
| Keyboard handling | Built-in | Built-in | N/A |

## Events

The most commonly used events:

| Event | When it fires | Payload |
|-------|--------------|---------|
| `onMount` | Content is mounted and ready | — |
| `onDidPresent` | Sheet finished presenting | `{ index, position, detent }` |
| `onDidDismiss` | Sheet finished dismissing | — |
| `onDetentChange` | User dragged or `resize()` changed the detent | `{ index, position, detent }` |
| `onPositionChange` | Continuous position updates during drag/animation | `{ index, position, detent, realtime }` |

For the full event list (drag events, focus/blur events, will/did lifecycle pairs, `onBackPress`), see the [API reference](./references/api.md#events).

## Methods

**On a ref:**
- `present(index?, animated?)` — show the sheet
- `dismiss(animated?)` — hide the sheet and all its children
- `dismissStack(animated?)` — hide only sheets stacked on top
- `resize(index)` — snap to a detent by index

**Global (native only):**
- `TrueSheet.present(name, index?, animated?)`
- `TrueSheet.dismiss(name, animated?)`
- `TrueSheet.dismissStack(name, animated?)`
- `TrueSheet.resize(name, index)`
- `TrueSheet.dismissAll(animated?)`

**Web hook:**
```tsx
const { present, dismiss, dismissStack, resize, dismissAll } = useTrueSheet()
```

## Stacking Sheets

Present a new sheet while another is visible and the first one hides automatically. Dismiss the top sheet and the previous one comes back. This is built-in — no extra config needed.

- `dismiss()` cascades: it dismisses the current sheet plus everything stacked on top
- `dismissStack()` dismisses only the sheets on top, keeping the current one visible
- Use `onDidFocus` / `onDidBlur` to react to a sheet gaining or losing the top position

## Deep-Dive References

When you need the full picture, load these reference files:

| Reference | What's inside |
|-----------|--------------|
| [Configuration](./references/configuration.md) | Every prop with type, default, platform support, and notes |
| [API](./references/api.md) | Complete events and methods reference with payload types |
| [Advanced Patterns](./references/advanced-patterns.md) | Navigation, Reanimated, Web, Side sheets, Liquid Glass, Jest mocking, Migration v2→v3 |
| [Troubleshooting](./references/troubleshooting.md) | Common issues and fixes by platform |
