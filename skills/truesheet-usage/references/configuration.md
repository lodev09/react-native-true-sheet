# Configuration Reference

Every TrueSheet prop with type, default value, and platform support.

**Legend:** 🍎 iOS · 🤖 Android · 🌐 Web

## Table of Contents

- [Sheet identity and control](#sheet-identity-and-control)
- [Sizing and detents](#sizing-and-detents)
- [Appearance](#appearance)
- [Blur](#blur)
- [Grabber](#grabber)
- [Accessibility](#accessibility)
- [Interaction](#interaction)
- [Dimming](#dimming)
- [Header and Footer](#header-and-footer)
- [Scrolling](#scrolling)
- [Layout and positioning](#layout-and-positioning)
- [Initial presentation](#initial-presentation)
- [Web-specific](#web-specific)

---

## Sheet identity and control

| Prop | Type | Default | Platforms | Description |
|------|------|---------|-----------|-------------|
| `ref` | `React.Ref<TrueSheet>` | — | 🍎🤖🌐 | Imperative handle for `present`, `dismiss`, `resize` |
| `name` | `string` | — | 🍎🤖🌐 | Unique identifier for global method access. Must be unique across the app |

## Sizing and detents

| Prop | Type | Default | Platforms | Description |
|------|------|---------|-----------|-------------|
| `detents` | `SheetDetent[]` | `[0.5, 1]` | 🍎🤖🌐 | Up to 3 snap heights, sorted smallest → largest. Values: `'auto'`, `'peek'`, or `0`–`1` |
| `maxContentHeight` | `number` | — | 🍎🤖🌐 | Absolute max height in dp |
| `maxContentWidth` | `number` | — | 🍎🤖🌐 | Max width. Android/Web default to 640dp; iOS uses the system width. Ignored on phones in portrait |

**`SheetDetent` values:**

| Value | Platforms | Description |
|-------|-----------|-------------|
| `'auto'` | 🍎 16+ 🤖🌐 | Size to the content's natural height. With a plugged scrollable, sizes to the scroll content and resizes as it grows/shrinks |
| `'peek'` | 🍎 16+ 🤖🌐 | Collapsed height from the measured `header` + absolute `footer` + content through the bottom edge of a `TrueSheetPeek` component. Falls back to `150` when none provided |
| `number` | 🍎🤖🌐 | Fraction (0–1) of the screen height |

## Appearance

| Prop | Type | Default | Platforms | Description |
|------|------|---------|-----------|-------------|
| `backgroundColor` | `ColorValue` | System default | 🍎🤖🌐 | Sheet background. On iOS 26.1+, setting this overrides Liquid Glass. Android default is Material 3 `colorSurfaceContainerLow` (adapts to light/dark) |
| `cornerRadius` | `number` | System default | 🍎🤖🌐 | Corner radius. iOS uses the device's native radius; Android defaults to `16` (Material 3) |
| `elevation` | `number` | 4 | 🤖🌐 | Shadow depth |
| `style` | `ViewStyle` | — | 🍎🤖🌐 | Content style override. Content wraps its children's height by default — pass `flex: 1` to fill the sheet's visible height per detent |

## Blur

| Prop | Type | Default | Platforms | Description |
|------|------|---------|-----------|-------------|
| `backgroundBlur` | `BackgroundBlur` | — | 🍎 | iOS blur effect applied over `backgroundColor`. On iOS 26.1+, setting this overrides Liquid Glass |
| `blurOptions` | `BlurOptions` | — | 🍎 | Fine-tune blur intensity and interaction |

**`BackgroundBlur` values:** `'light'`, `'dark'`, `'default'`, `'extra-light'`, `'regular'`, `'prominent'`, `'system-ultra-thin-material'`, `'system-thin-material'`, `'system-material'`, `'system-thick-material'`, `'system-chrome-material'`, plus `-light` and `-dark` variants of each system material.

**`BlurOptions`:**
```tsx
{
  intensity?: number    // 0–100 (default: system)
  interaction?: boolean // allow touches through blur (default: true). Disabling can help with visual artifacts on iOS 18+
}
```

## Grabber

| Prop | Type | Default | Platforms | Description |
|------|------|---------|-----------|-------------|
| `grabber` | `boolean` | `true` | 🍎🤖🌐 | Show the native drag handle. Auto-hidden when `draggable` is `false` |
| `grabberOptions` | `GrabberOptions` | — | 🍎🤖 | Customize grabber appearance. On iOS, providing any option replaces the system grabber with a custom vibrancy view |

**`GrabberOptions`:**
```tsx
{
  width?: number        // iOS: 36, Android: 32
  height?: number       // iOS: 5, Android: 4
  topMargin?: number    // iOS: 5, Android: 16
  cornerRadius?: number // default: height / 2
  color?: ColorValue
  adaptive?: boolean    // auto-contrast against light/dark mode (default: true)
}
```

## Accessibility

| Prop | Type | Default | Platforms | Description |
|------|------|---------|-----------|-------------|
| `accessibilityOptions` | `AccessibilityOptions` | — | 🍎🤖🌐 | Customize/localize screen-reader strings |

**`AccessibilityOptions`:**
```tsx
{
  grabberLabel?: string        // iOS: 'Sheet Grabber', Android: 'Drag handle'
  grabberHint?: string         // iOS only
  expandedValue?: string       // announced at the last detent (default: 'Expanded')
  collapsedValue?: string      // announced at the first detent (default: 'Collapsed')
  detentValue?: string         // intermediate detents; supports {index} and {count} (default: 'Detent {index} of {count}')
  expandActionLabel?: string   // Android only (default: 'Expand')
  collapseActionLabel?: string // Android only (default: 'Collapse')
  paneTitle?: string           // Android pane title / Web hidden dialog title
}
```

On iOS, grabber strings only apply when `grabberOptions` is provided (the system grabber is already localized).

## Interaction

| Prop | Type | Default | Platforms | Description |
|------|------|---------|-----------|-------------|
| `dismissible` | `boolean` | `true` | 🍎🤖🌐 | Whether the user can swipe to dismiss or tap outside |
| `draggable` | `boolean` | `true` | 🍎🤖🌐 | Whether the user can drag to resize. When `false`, the grabber is hidden |

## Dimming

| Prop | Type | Default | Platforms | Description |
|------|------|---------|-----------|-------------|
| `dimmed` | `boolean` | `true` | 🍎🤖🌐 | Show background dim overlay |
| `dimmedDetentIndex` | `number` | `0` | 🍎🤖🌐 | Detent index at which dimming activates. Set to `1` to keep background interactive at the first detent |

## Header and Footer

| Prop | Type | Default | Platforms | Description |
|------|------|---------|-----------|-------------|
| `header` | `ReactElement \| ComponentType` | — | 🍎🤖🌐 | Fixed header rendered in a native container. Prefer passing an element over a component for perf |
| `headerStyle` | `ViewStyle` | — | 🍎🤖🌐 | Style for header container |
| `headerOptions` | `HeaderOptions` | — | 🍎🤖🌐 | Header layout behavior |
| `footer` | `ReactElement \| ComponentType` | — | 🍎🤖🌐 | Fixed footer pinned to the sheet's bottom edge. Prefer passing an element over a component for perf |
| `footerStyle` | `ViewStyle` | — | 🍎🤖🌐 | Style for footer container. Set the background here so it fills the safe-area inset |
| `footerOptions` | `FooterOptions` | — | 🍎🤖🌐 | Footer layout and keyboard behavior |

**`HeaderOptions`:**
```tsx
{
  position?: 'relative' | 'absolute' // default: 'relative'
}
```
- `'relative'`: takes space above the content, included in the `'auto'` detent height.
- `'absolute'`: floats over the content, pinned to the top edge, excluded from `'auto'`. Add top padding to your content so it starts below the header.

**`FooterOptions`:**
```tsx
{
  position?: 'relative' | 'absolute' // default: 'relative'
  keyboardOffset?: number            // default: 0 — absolute footers only
}
```
- `'relative'`: takes space below the content, included in `'auto'` but **excluded from `'peek'`** (pushed off-screen at peek). Stays in the layout flow behind the keyboard. If content is taller than the sheet (fixed detents), bound it with `flex: 1` on the sheet `style` so the footer stays visible.
- `'absolute'`: floats over the content, excluded from `'auto'` but **included in `'peek'`**, and rises above the keyboard. Add bottom padding to your content so it ends above the footer.
- `keyboardOffset` adjusts how far an absolute footer rises with the keyboard. Negative values tuck the footer's own bottom padding behind the keyboard.

**Safe area:** the footer absorbs the bottom safe-area inset as padding when `insetAdjustment` is `'automatic'` — don't add manual `paddingBottom: insets.bottom` or it doubles up. While the keyboard is open, an absolute footer skips the inset (no gap above the keyboard).

## Scrolling

| Prop | Type | Default | Platforms | Description |
|------|------|---------|-----------|-------------|
| `scrollableRef` | `RefObject<Component>` | — | 🍎🤖🌐 | Ref to the ScrollView/FlatList inside the content. Wires nested scrolling, keyboard insets, and `'auto'` detent sizing. Replaces the v3 `scrollable` prop |
| `scrollableOptions` | `ScrollableOptions` | — | 🍎🤖🌐 | Fine-tune scrollable behavior |

**`ScrollableOptions`:**
```tsx
{
  contentInsetAdjustmentBehavior?: boolean  // apply bottom safe-area inset to scroll content while it can scroll (default: true)
  scrollingExpandsSheet?: boolean           // scrolling to top expands the sheet (default: true)
  keyboardScrollOffset?: number             // extra spacing above keyboard when scrolling to a focused input (default: 0)
  keyboardOffset?: number                   // adjust the keyboard bottom inset; pass -insets.bottom to cancel manual padding (default: 0)
  topScrollEdgeEffect?: ScrollEdgeEffect    // iOS 26+, applies to header + scroll top edge
  bottomScrollEdgeEffect?: ScrollEdgeEffect // iOS 26+, applies to footer + scroll bottom edge
}
```

**`ScrollEdgeEffect`:** `'automatic'` | `'hard'` | `'soft'` | `'hidden'` (default: `'hidden'`). iOS 26+ only.

Like any scroll view, a plugged scrollable needs a bounded height for fixed detents — pass `flex: 1` via the sheet's `style`. With an `'auto'` detent no flex is needed. On Android, nested scrolling is managed internally (`nestedScrollEnabled` is ignored) and `RefreshControl` is supported.

## Layout and positioning

| Prop | Type | Default | Platforms | Description |
|------|------|---------|-----------|-------------|
| `anchor` | `'left' \| 'center' \| 'right'` | `'center'` | 🍎🤖🌐 | Horizontal positioning. Ignored on phones in portrait |
| `anchorOffset` | `number` | `16` | 🤖🌐 | Edge margin when anchored left/right |
| `presentation` | `'page' \| 'form'` | `'page'` | 🍎🌐 | iPad/web (landscape/tablet) presentation. `'form'` is absolute and ignores `maxContentWidth`. iOS 17+ |
| `insetAdjustment` | `'automatic' \| 'never'` | `'automatic'` | 🍎🤖 | Bottom safe-area handling. `'never'` keeps the layout as-is for precise sizing |

## Initial presentation

| Prop | Type | Default | Platforms | Description |
|------|------|---------|-----------|-------------|
| `initialDetentIndex` | `number` | `-1` | 🍎🤖🌐 | Auto-present at this detent on mount. `-1` means don't auto-present |
| `initialDetentAnimated` | `boolean` | `true` | 🍎🤖🌐 | Animate the initial presentation |

## Web-specific

| Prop | Type | Default | Platforms | Description |
|------|------|---------|-----------|-------------|
| `detached` | `boolean` | `false` | 🌐 | Render as a floating card instead of bottom-attached |
| `detachedOffset` | `number` | `16` | 🌐 | Gap from bottom edge for detached sheets |
