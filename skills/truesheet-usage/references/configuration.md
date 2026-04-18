# Configuration Reference

Every TrueSheet prop with type, default value, and platform support.

**Legend:** 🍎 iOS · 🤖 Android · 🌐 Web

## Table of Contents

- [Sheet identity and control](#sheet-identity-and-control)
- [Sizing and detents](#sizing-and-detents)
- [Appearance](#appearance)
- [Blur](#blur)
- [Grabber](#grabber)
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
| `detents` | `SheetDetent[]` | — | 🍎🤖🌐 | Up to 3 snap heights, sorted smallest → largest. Values: `'auto'` or `0`–`1` |
| `maxContentHeight` | `number` | — | 🍎🤖🌐 | Absolute max height in dp |
| `maxContentWidth` | `number` | 640 | 🤖🌐 | Max width. On Android/Web defaults to 640dp |

## Appearance

| Prop | Type | Default | Platforms | Description |
|------|------|---------|-----------|-------------|
| `backgroundColor` | `ColorValue` | System default | 🍎🤖🌐 | Sheet background. On iOS 26+, setting this disables Liquid Glass |
| `cornerRadius` | `number` | System default | 🍎🤖🌐 | Corner radius of the sheet |
| `elevation` | `number` | 4 | 🤖🌐 | Shadow depth |
| `style` | `ViewStyle` | — | 🍎🤖🌐 | Container style override |

## Blur

| Prop | Type | Default | Platforms | Description |
|------|------|---------|-----------|-------------|
| `backgroundBlur` | `BackgroundBlur` | — | 🍎 | iOS blur effect applied to the sheet background |
| `blurOptions` | `BlurOptions` | — | 🍎 | Fine-tune blur intensity and interaction |

**`BackgroundBlur` values:** `'light'`, `'dark'`, `'default'`, `'extra-light'`, `'regular'`, `'prominent'`, `'system-ultra-thin-material'`, `'system-thin-material'`, `'system-material'`, `'system-thick-material'`, `'system-chrome-material'`, plus `-light` and `-dark` variants of each system material.

**`BlurOptions`:**
```tsx
{
  intensity?: number   // 0–100 (default: system)
  interaction?: boolean // allow touches through blur (default: true)
}
```

## Grabber

| Prop | Type | Default | Platforms | Description |
|------|------|---------|-----------|-------------|
| `grabber` | `boolean` | `true` | 🍎🤖🌐 | Show the native drag handle |
| `grabberOptions` | `GrabberOptions` | — | 🍎🤖🌐 | Customize grabber appearance |

**`GrabberOptions`:**
```tsx
{
  width?: number        // iOS: 36, Android: 32
  height?: number       // iOS: 5, Android: 4
  topMargin?: number    // iOS: 5, Android: 16
  cornerRadius?: number // default: height / 2
  color?: ColorValue
  adaptive?: boolean    // auto-contrast against background (default: true)
}
```

## Interaction

| Prop | Type | Default | Platforms | Description |
|------|------|---------|-----------|-------------|
| `dismissible` | `boolean` | `true` | 🍎🤖🌐 | Whether the user can swipe to dismiss |
| `draggable` | `boolean` | `true` | 🍎🤖🌐 | Whether the user can drag to resize |

## Dimming

| Prop | Type | Default | Platforms | Description |
|------|------|---------|-----------|-------------|
| `dimmed` | `boolean` | `true` | 🍎🤖🌐 | Show background dim overlay |
| `dimmedDetentIndex` | `number` | `0` | 🍎🤖🌐 | Detent index at which dimming activates. Set to `1` to keep background interactive at the first detent |

## Header and Footer

| Prop | Type | Default | Platforms | Description |
|------|------|---------|-----------|-------------|
| `header` | `ReactElement` | — | 🍎🤖🌐 | Fixed header rendered above content in a native container. Height is auto-deducted from available space |
| `headerStyle` | `ViewStyle` | — | 🍎🤖🌐 | Style for header container |
| `footer` | `ReactElement \| ComponentType` | — | 🍎🤖🌐 | Fixed footer below content. Prefer passing an element over a component for perf |
| `footerStyle` | `ViewStyle` | — | 🍎🤖🌐 | Style for footer container |

## Scrolling

| Prop | Type | Default | Platforms | Description |
|------|------|---------|-----------|-------------|
| `scrollable` | `boolean` | — | 🍎🤖 | Auto-pins ScrollView/FlatList to fit available space. Cannot be used with `'auto'` detent |
| `scrollableOptions` | `ScrollableOptions` | — | 🍎🤖 | Fine-tune scroll behavior |

**`ScrollableOptions`:**
```tsx
{
  scrollingExpandsSheet?: boolean       // Scrolling to top expands sheet (default: true)
  keyboardScrollOffset?: number         // Extra spacing above keyboard (default: 0)
  topScrollEdgeEffect?: ScrollEdgeEffect   // iOS 26+
  bottomScrollEdgeEffect?: ScrollEdgeEffect // iOS 26+
}
```

**`ScrollEdgeEffect`:** `'automatic'` | `'hard'` | `'soft'` | `'hidden'` (default: `'hidden'`)

**Web scrolling:** The `scrollable` prop is currently native-only. On web, wrap content in a standard scrollable container.

## Layout and positioning

| Prop | Type | Default | Platforms | Description |
|------|------|---------|-----------|-------------|
| `anchor` | `'left' \| 'center' \| 'right'` | `'center'` | 🍎🤖🌐 | Horizontal positioning. Ignored on phones in portrait |
| `anchorOffset` | `number` | `16` | 🤖🌐 | Edge margin when anchored left/right |
| `pageSizing` | `boolean` | `true` | 🍎 | iPad: page sheet (true) vs form sheet (false). iOS 17+ |
| `insetAdjustment` | `'automatic' \| 'never'` | `'automatic'` | 🍎🤖🌐 | Bottom safe area handling |

## Initial presentation

| Prop | Type | Default | Platforms | Description |
|------|------|---------|-----------|-------------|
| `initialDetentIndex` | `number` | `-1` | 🍎🤖🌐 | Auto-present at this detent on mount. `-1` means don't auto-present |
| `initialDetentAnimated` | `boolean` | `true` | 🍎🤖🌐 | Animate the initial presentation |

## Web-specific

| Prop | Type | Default | Platforms | Description |
|------|------|---------|-----------|-------------|
| `detached` | `boolean` | — | 🌐 | Render as a floating card instead of bottom-attached |
| `detachedOffset` | `number` | `16` | 🌐 | Gap from bottom edge for detached sheets |
