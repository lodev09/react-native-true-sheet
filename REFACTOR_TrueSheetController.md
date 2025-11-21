# TrueSheetController Refactoring

## Overview

Refactored `TrueSheetDialog` into `TrueSheetController` to implement a cleaner lifecycle management pattern similar to iOS `TrueSheetViewController`. The key improvement is lazy dialog creation when the container view mounts, ensuring clean state for each presentation.

## Changes

### Files Changed

1. **Created:** `android/src/main/java/com/lodev09/truesheet/TrueSheetController.kt`
2. **Updated:** `android/src/main/java/com/lodev09/truesheet/TrueSheetView.kt`
3. **Deleted:** `android/src/main/java/com/lodev09/truesheet/TrueSheetDialog.kt`

### Key Architectural Changes

#### Before: TrueSheetDialog Pattern
```kotlin
// TrueSheetDialog extended BottomSheetDialog
class TrueSheetDialog(context, rootView) : BottomSheetDialog(context) {
    init {
        setContentView(rootView)
        // Dialog created immediately in init
    }
}

// Usage in TrueSheetView
val sheetDialog = TrueSheetDialog(reactContext, sheetRootView)
```

**Problems:**
- Dialog created before container view was mounted
- Dialog instance persisted across presentations
- Potential stale state between presentations
- No clean separation between controller logic and dialog lifecycle

#### After: TrueSheetController Pattern
```kotlin
// TrueSheetController is a regular class that manages dialog
class TrueSheetController(context, rootView) {
    private var dialog: BottomSheetDialog? = null
    
    fun createDialog() {
        if (dialog != null) return
        dialog = BottomSheetDialog(context).apply {
            setContentView(rootView)
            // Setup listeners and behavior
        }
    }
    
    private fun cleanupDialog() {
        // Clean up listeners and state
        dialog = null
    }
}

// Usage in TrueSheetView
val sheetController = TrueSheetController(reactContext, sheetRootView)
// Dialog created when container mounts
sheetController.createDialog()
```

**Benefits:**
- Dialog created lazily when container view is ready
- Dialog cleaned up after each dismissal
- Clean state for each presentation
- Controller pattern matches iOS implementation
- Better separation of concerns

## Implementation Details

### 1. TrueSheetController Class

The controller is a regular Kotlin class (not extending Dialog) that:

- **Holds Properties:** All sheet configuration (detents, dimmed, cornerRadius, etc.)
- **Manages Dialog Lifecycle:** Creates dialog on demand, cleans up on dismiss
- **Delegates Events:** Uses `TrueSheetControllerDelegate` interface
- **Provides Methods:** `present()`, `dismiss()`, `configure()`, etc.

#### Dialog Lifecycle

```kotlin
// Dialog creation - called when container mounts
fun createDialog() {
    if (dialog != null) return
    
    dialog = BottomSheetDialog(reactContext).apply {
        setContentView(sheetRootView)
        setupDialogListeners(this)
        setupBottomSheetBehavior(this)
        // Apply initial properties
    }
}

// Dialog cleanup - called automatically on dismiss
private fun cleanupDialog() {
    dialog?.apply {
        setOnShowListener(null)
        setOnCancelListener(null)
        setOnDismissListener(null)
    }
    
    unregisterKeyboardManager()
    dialog = null
    isDragging = false
}
```

### 2. Lazy Dialog Creation

The dialog is now created at the right time:

```kotlin
// In TrueSheetView.addView()
override fun addView(child: View?, index: Int) {
    sheetRootView.addView(child, index)
    
    // Create dialog when TrueSheetContainerView is added
    if (child is TrueSheetContainerView) {
        sheetController.createDialog()
        
        // Dispatch mount event
        eventDispatcher?.dispatchEvent(MountEvent(surfaceId, id))
    }
}
```

### 3. Delegate Pattern Update

Renamed delegate methods to match controller pattern:

**Before:**
```kotlin
interface TrueSheetDialogDelegate {
    fun dialogWillPresent(index: Int, position: Float)
    fun dialogDidPresent(index: Int, position: Float)
    // ...
}
```

**After:**
```kotlin
interface TrueSheetControllerDelegate {
    fun controllerWillPresent(index: Int, position: Float)
    fun controllerDidPresent(index: Int, position: Float)
    // ...
}
```

### 4. Property Management

Properties are stored in the controller and applied to the dialog when needed:

```kotlin
// Controller properties
var cornerRadius: Float = 0f
var backgroundColor: Int = Color.WHITE
var dimmed = true
var dismissible: Boolean = true
    set(value) {
        field = value
        // Apply to dialog if it exists
        dialog?.apply {
            setCanceledOnTouchOutside(value)
            setCancelable(value)
            behavior.isHideable = value
        }
    }

// Apply methods
fun setupBackground() {
    // Updates dialog background based on current properties
}

fun setupDimmedBackground(detentIndex: Int) {
    // Updates dialog dimming based on current properties
}
```

### 5. Clean State Guarantee

Each presentation gets a fresh dialog instance:

```
User Action              | Dialog State
-------------------------|---------------------------
Component mounts         | Controller created
Container view added     | Dialog created
present() called         | Dialog shown
User dismisses           | Dialog dismissed → cleanupDialog()
present() called again   | New dialog created
```

## Migration Notes

### For Maintainers

1. **Dialog Access:** Dialog is now nullable `private var dialog: BottomSheetDialog?`
   - Always use safe calls: `dialog?.window`
   - Check `isShowing` property instead of calling directly

2. **Property Updates:** When adding new properties:
   ```kotlin
   var newProperty: Type = defaultValue
       set(value) {
           field = value
           // Apply to dialog if it exists
           dialog?.applyNewProperty(value)
       }
   ```

3. **Lifecycle Methods:** Use controller methods instead of dialog methods:
   - `controller.present()` instead of `dialog.show()`
   - `controller.dismiss()` instead of `dialog.dismiss()`
   - `controller.isShowing` instead of `dialog.isShowing`

### Backwards Compatibility

No changes to JavaScript API - all changes are internal to Android implementation.

## Testing Checklist

- [x] Build succeeds without errors
- [ ] Sheet presents correctly on first mount
- [ ] Sheet presents correctly on subsequent presentations
- [ ] Properties (dimmed, cornerRadius, detents) apply correctly
- [ ] Keyboard handling works
- [ ] Footer positioning works
- [ ] Gesture handling (drag, dismiss) works
- [ ] Edge-to-edge mode works
- [ ] Memory: No leaks after multiple present/dismiss cycles
- [ ] State: Clean content state on each presentation

## Benefits Summary

1. **Cleaner Lifecycle:** Dialog created when needed, destroyed when done
2. **iOS Parity:** Matches iOS controller pattern
3. **Clean State:** Fresh start for each presentation
4. **Better Separation:** Controller manages logic, dialog handles presentation
5. **Memory Efficient:** Dialog resources released after dismiss
6. **Maintainable:** Clear ownership and lifecycle boundaries

## Related Commits

- Initial refactor: Convert TrueSheetDialog to TrueSheetController
- Fix naming conflict: Rename setEdgeToEdge to applyEdgeToEdge
- Clean up: Remove old TrueSheetDialog.kt file

## Future Improvements

1. Consider adding controller state enum (idle, presenting, presented, dismissing)
2. Add debug logging for lifecycle events
3. Consider pooling dialog instances if performance is critical
4. Add metrics for dialog creation/destruction cycles