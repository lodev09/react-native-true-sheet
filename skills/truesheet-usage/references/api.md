# API Reference

Complete events and methods for TrueSheet.

## Table of Contents

- [Methods](#methods)
  - [Ref methods](#ref-methods)
  - [Global methods (native only)](#global-methods-native-only)
  - [Web hook](#web-hook)
- [Events](#events)
  - [Lifecycle events](#lifecycle-events)
  - [Detent and drag events](#detent-and-drag-events)
  - [Position events](#position-events)
  - [Focus events](#focus-events)
  - [Platform events](#platform-events)
- [Payload types](#payload-types)

---

## Methods

### Ref methods

All return a `Promise` that resolves when the animation completes.

| Method | Signature | Description |
|--------|-----------|-------------|
| `present` | `(index?: number, animated?: boolean) => Promise<void>` | Show the sheet. `index` defaults to `0` (first detent) |
| `dismiss` | `(animated?: boolean) => Promise<void>` | Hide the sheet and all sheets stacked on top |
| `dismissStack` | `(animated?: boolean) => Promise<void>` | Hide only the sheets stacked on top, keep this one visible |
| `resize` | `(index: number) => Promise<void>` | Snap to a detent by **index** (not value) |

### Global methods (native only)

Same behavior as ref methods, but addressed by `name`. These do not exist on web.

```tsx
await TrueSheet.present(name: string, index?: number, animated?: boolean)
await TrueSheet.dismiss(name: string, animated?: boolean)
await TrueSheet.dismissStack(name: string, animated?: boolean)
await TrueSheet.resize(name: string, index: number)
await TrueSheet.dismissAll(animated?: boolean)
```

`dismissAll` closes every sheet in the current context. It won't affect sheets behind a React Native `Modal`.

### Web hook

On web, use the `useTrueSheet()` hook from inside a `TrueSheetProvider`:

```tsx
const { present, dismiss, dismissStack, resize, dismissAll } = useTrueSheet()

// Same signatures as global methods
await present('sheet-name')
await dismiss('sheet-name')
```

---

## Events

### Lifecycle events

These fire in pairs — "will" before the animation and "did" after.

| Event | Payload | When |
|-------|---------|------|
| `onMount` | — | Content is mounted and ready. The sheet waits for this before presenting |
| `onWillPresent` | `DetentInfoEventPayload` | About to start presenting |
| `onDidPresent` | `DetentInfoEventPayload` | Finished presenting |
| `onWillDismiss` | — | About to start dismissing |
| `onDidDismiss` | — | Finished dismissing |

### Detent and drag events

| Event | Payload | When |
|-------|---------|------|
| `onDetentChange` | `DetentInfoEventPayload` | Detent changed (via drag or `resize()`) |
| `onDragBegin` | `DetentInfoEventPayload` | User started dragging |
| `onDragChange` | `DetentInfoEventPayload` | User is currently dragging |
| `onDragEnd` | `DetentInfoEventPayload` | User stopped dragging |

### Position events

| Event | Payload | When |
|-------|---------|------|
| `onPositionChange` | `PositionChangeEventPayload` | Continuous position updates during drag or animation |

The `realtime` field in the payload distinguishes native animation frames (`true`) from JS-driven updates (`false`). Use `realtime: true` for Reanimated worklets; use `realtime: false` when you need to drive JS-based animations.

### Focus events

Relevant when stacking sheets. A sheet "blurs" when another sheet presents on top, and "focuses" when it regains the top position.

| Event | Payload | When |
|-------|---------|------|
| `onWillFocus` | — | About to gain focus (presented, or child sheet begins dismissing) |
| `onDidFocus` | — | Gained focus |
| `onWillBlur` | — | About to lose focus (dismissed, or child sheet presents) |
| `onDidBlur` | — | Lost focus |

### Platform events

| Event | Payload | Platforms | When |
|-------|---------|-----------|------|
| `onBackPress` | — | 🤖 Android | Hardware back button pressed while sheet is visible |

---

## Payload types

### `DetentInfoEventPayload`

```tsx
{
  index: number     // Index in the detents array
  position: number  // Y position from top of screen
  detent: number    // The detent value (0–1)
}
```

### `PositionChangeEventPayload`

Extends `DetentInfoEventPayload`:

```tsx
{
  index: number     // Continuous float — 0.5 means halfway between detent 0 and 1
  position: number
  detent: number
  realtime: boolean // true = native animation frame, false = JS-driven
}
```
