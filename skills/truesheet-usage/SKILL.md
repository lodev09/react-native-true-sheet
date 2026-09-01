---
name: truesheet-usage
description: >-
  Consumer-side guide for integrating @lodev09/react-native-true-sheet into a React Native app.
  Use this skill whenever the user wants to add, configure, control, or debug a bottom sheet using TrueSheet —
  including ref-based sheets, named global sheets, web support with TrueSheetProvider/useTrueSheet,
  React Navigation or Expo Router sheet flows, Reanimated-driven animations, scrolling content,
  stacking, headers/footers, detents, peeking, side sheets, keyboard handling, dimming, liquid glass,
  and Jest testing. Also use when the user is migrating from v3 to v4, troubleshooting layout or
  gesture issues, or asking about any TrueSheet prop, event, or method — even if they don't
  mention "TrueSheet" by name but describe a bottom sheet in a React Native context.
---

# TrueSheet Consumer Guide

Use this skill to produce correct, idiomatic code for apps that consume `@lodev09/react-native-true-sheet` (v4). It covers choosing the right integration pattern, applying the public API correctly, and avoiding platform-specific pitfalls.

Requires React Native >= 0.82 (Expo SDK 55+) with the New Architecture.

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

## Content Layout (v4)

The sheet's content lays out **naturally** — it wraps its children's height like a regular view or a React Navigation screen. It does **not** fill the sheet by default. Consequences:

- A `flex: 1` child collapses to zero height unless the content is filled.
- To fill the sheet's visible height per detent (spacers, centered content, bounded scroll views), pass `flex: 1` via the sheet's `style` prop:

```tsx
<TrueSheet style={{ flex: 1 }} detents={[0.5, 1]}>
  <View style={{ flex: 1, justifyContent: 'center' }}>
    <Text>Centered</Text>
  </View>
</TrueSheet>
```

The content is sized to the sheet's visible height per detent and tracks it in realtime while dragging, so flex layouts follow the sheet's edge frame-by-frame.

## Choose the Right Control Pattern

Pick one based on where the trigger lives relative to the sheet and which platforms you target.

| Pattern | When to use | Platform |
|---------|------------|----------|
| **Ref** | Trigger and sheet in the same component | All |
| **Named + global methods** | Trigger is far from the sheet (different screen, deep in tree) | Native only |
| **`TrueSheetProvider` + `useTrueSheet()`** | Web support needed, or you want hook-based control | All (required on web) |
| **`createTrueSheetNavigator()` / Expo Router `Sheet`** | Sheets are part of a navigation flow | All |
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

Wrap your app with `TrueSheetProvider` (on native this is a pass-through with zero overhead). Web also needs `@radix-ui/react-dialog` and `@radix-ui/react-presence` installed (optional peer deps):

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

See [advanced patterns reference](./references/advanced-patterns.md#react-navigation) for full setup with `createTrueSheetNavigator`, the static API (`createTrueSheetScreen`), the Expo Router `Sheet` layout from `/navigation/expo-router`, screen options, and `useTrueSheetNavigation`.

### Reanimated

See [advanced patterns reference](./references/advanced-patterns.md#reanimated) for `ReanimatedTrueSheet`, `ReanimatedTrueSheetProvider`, and animated values (`animatedPosition`, `animatedIndex`, `animatedDetent`).

## Detents

Detents define the heights the sheet can snap to. You get up to **3 detents**, sorted smallest to largest. Default: `[0.5, 1]`.

| Value | Meaning |
|-------|---------|
| `'auto'` | Size to fit the content (iOS 16+, Android, Web). Works with scrollables — sizes to the scroll content and resizes as it grows/shrinks |
| `'peek'` | Collapsed height from the measured `header` + absolute `footer` + content through a `TrueSheetPeek` marker (iOS 16+, Android, Web). Falls back to `150` when none provided |
| `0` – `1` | Fraction of the screen height |

```tsx
// Content-sized sheet
<TrueSheet detents={['auto']} />

// Half and full screen
<TrueSheet detents={[0.5, 1]} />

// Collapsed summary that expands to near-full
<TrueSheet detents={['peek', 0.9]} />
```

## Common Recipes

### Scrollable content

Point the sheet at your scroll view with `scrollableRef`. For fixed detents, bound the scroll view with `flex: 1` on the sheet's `style`:

```tsx
const scrollableRef = useRef<ScrollView>(null)

<TrueSheet scrollableRef={scrollableRef} style={{ flex: 1 }} detents={[0.5, 1]} grabber>
  <ScrollView ref={scrollableRef}>
    {items.map(item => <ItemRow key={item.id} item={item} />)}
  </ScrollView>
</TrueSheet>
```

- With `detents={['auto']}` no `flex: 1` is needed — the sheet sizes to the scroll content and bounds the viewport automatically
- The scroll view doesn't have to be a direct child — a wrapping `View` works
- Keyboard handling, nested scrolling (Android), and the bottom safe-area inset are wired automatically
- Scrolling to top expands to the next detent — disable with `scrollableOptions={{ scrollingExpandsSheet: false }}` (YouTube-style comments)
- The bottom safe-area inset is applied natively while content can scroll — don't add manual safe-area padding, or opt out with `scrollableOptions={{ contentInsetAdjustmentBehavior: false }}`

### Fixed header and footer

```tsx
<TrueSheet
  detents={[0.5, 1]}
  scrollableRef={scrollableRef}
  style={{ flex: 1 }}
  header={
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Title</Text>
    </View>
  }
  footer={<BottomActions />}
>
  <ScrollView ref={scrollableRef}>{/* ... */}</ScrollView>
</TrueSheet>
```

- Use the `header` and `footer` props — they render in native container views, so the layout math is handled for you. Don't fake it with absolute positioning.
- Both are **relative** by default: header takes space above the content, footer below it, and both count toward the `'auto'` detent.
- The footer **absorbs the bottom safe-area inset** natively — remove manual `paddingBottom: insets.bottom` from footer content or it doubles up. Set the footer background via `footerStyle` so it fills the inset.
- A relative footer is laid out below the content — with fixed detents, bound the content with `flex: 1` (sheet `style`) so the footer stays visible.
- To float them over the content instead (excluded from `'auto'` height), use `headerOptions={{ position: 'absolute' }}` / `footerOptions={{ position: 'absolute' }}`. An absolute footer rises above the keyboard; a relative one stays in the layout flow behind it.

### Peeking (map-style collapsed sheet)

```tsx
import { TrueSheet, TrueSheetPeek } from '@lodev09/react-native-true-sheet'

<TrueSheet detents={['peek', 0.9]} initialDetentIndex={0} header={<Summary />}>
  <TrueSheetPeek>
    <QuickActions />
  </TrueSheetPeek>
  <FullDetails />
</TrueSheet>
```

Collapsed, the sheet shows everything from the top through the **bottom edge** of `TrueSheetPeek`; content below stays hidden until expanded. An empty `<TrueSheetPeek />` works as a fold marker between existing views. One peek component per sheet. Absolute footers count toward the peek height; relative footers don't (pushed off-screen at peek).

### Toasts and dialogs above sheets

```tsx
import { TrueSheet, TrueSheetOverlay } from '@lodev09/react-native-true-sheet'

<TrueSheetOverlay>
  {toast && <Toast message={toast} />}
</TrueSheetOverlay>
```

Renders children in a native layer above every presented sheet. Show/hide by conditionally rendering children. Fills the window; touches that miss the children pass through. Never use RN `Modal`/`FullWindowOverlay` for this anymore.

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
2. **Content doesn't fill the sheet by default** — pass `style={{ flex: 1 }}` on the sheet when children use `flex: 1`, or they render with zero height.
3. **`scrollableRef` replaces the v3 `scrollable` prop** — pass a ref of the ScrollView/FlatList. Bound it with `flex: 1` on the sheet `style` for fixed detents; `'auto'` needs no flex.
4. **`resize()` takes an index**, not a fraction. `resize(1)` means "go to the second detent."
5. **Sheet names must be unique** across your entire app.
6. **Static methods are native-only** — use `useTrueSheet()` on web.
7. **Don't add manual safe-area padding** to footers or plugged scroll content — the footer absorbs the bottom inset and the scrollable gets it natively. Doubling up is the most common v4 layout bug.
8. **Don't use `autoFocus` on TextInputs** inside sheets. Focus in `onDidPresent` instead:
   ```tsx
   <TrueSheet onDidPresent={() => inputRef.current?.focus()}>
   ```
9. **Use `flexGrow: 1`** (not `flex: 1`) on `GestureHandlerRootView` inside the sheet on Android — unless the sheet itself has `style={{ flex: 1 }}`.
10. **Dismiss sheets before closing Modals** on iOS — React Native has a bug where dismissing a Modal while a sheet is visible causes a blank screen.
11. **Use `header`/`footer` props** for fixed chrome — don't reach for absolute positioning. Float them with `headerOptions`/`footerOptions` `position: 'absolute'` when they should overlay content.
12. **Liquid Glass** is automatic on iOS 26+. Set `backgroundColor` or `backgroundBlur` to disable it per-sheet (iOS 26.1+), or add `UIDesignRequiresCompatibility` to Info.plist to disable app-wide.

## Platform Differences at a Glance

| Feature | iOS | Android | Web |
|---------|-----|---------|-----|
| `'auto'` detent | iOS 16+ | Yes | Yes |
| `'peek'` detent / `TrueSheetPeek` | iOS 16+ | Yes | Yes |
| `TrueSheetOverlay` | Yes | Yes | Yes |
| `backgroundBlur` | Yes | No | No |
| Liquid Glass | iOS 26+ | No | No |
| Static global methods | Yes | Yes | No (use provider) |
| `scrollableRef` | Yes | Yes | Yes |
| Scroll edge effects | iOS 26+ | No | No |
| `grabberOptions` | Yes | Yes | No |
| `anchor` / side sheets | System-controlled margins | `anchorOffset` prop | `anchorOffset` prop |
| `presentation` | iOS 17+ (iPad) | N/A | Landscape/tablet |
| `detached` mode | No | No | Yes |
| `insetAdjustment` | Yes | Yes | No |
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
| [Advanced Patterns](./references/advanced-patterns.md) | Navigation, Reanimated, Web, Side sheets, Liquid Glass, Jest mocking, Migration v3→v4 |
| [Troubleshooting](./references/troubleshooting.md) | Common issues and fixes by platform |
