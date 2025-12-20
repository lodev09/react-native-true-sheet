# TrueSheet Android Architecture Change

## Problem

When TrueSheet was presented over a Map component, map panning/dragging was laggy. The FPS was fine (60fps), but touch interactions felt blocked or delayed.

## Root Cause

**`BottomSheetDialogFragment` creates a separate window layer** that inherently intercepts all touch events, even when touches are outside the sheet area. This is by design for modal dialogs, but it causes touch handling issues for non-modal use cases.

## Solution: CoordinatorLayout Approach (like react-native-screens)

### What react-native-screens uses:

- **Regular Fragment** (`ScreenStackFragment`) - NOT `BottomSheetDialogFragment`
- **`CoordinatorLayout`** as the container added to activity's content view
- **`BottomSheetBehavior`** attached via `CoordinatorLayout.LayoutParams`
- **`DimmingView`** placed inside the same CoordinatorLayout (not a separate window)
- **`RootView` interface** implementation for React Native touch dispatching

### Key Differences

| Aspect | Old TrueSheet (DialogFragment) | New TrueSheet (CoordinatorLayout) | react-native-screens |
|--------|-------------------------------|-----------------------------------|---------------------|
| Window | Separate dialog window | Same activity window | Same activity window |
| Touch handling | Dialog intercepts all touches | Pass-through for non-sheet areas | Pass-through |
| Dimming | `FLAG_DIM_BEHIND` window flag | Custom `DimView` in hierarchy | Custom `DimmingView` |
| Sheet behavior | `BottomSheetDialogFragment` | `BottomSheetBehavior` on container | `BottomSheetBehavior` |
| Fragment | `DialogFragment` subclass | No fragment needed | Regular `Fragment` |
