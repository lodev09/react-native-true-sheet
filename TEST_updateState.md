# Testing Guide: Investigating updateState Calls

## Overview
This guide helps you verify whether `updateState()` in `TrueSheetViewManager.kt` is being called by React Native's Fabric architecture.

## Prerequisites

```bash
cd example
npm install
cd android && ./gradlew clean
cd ../..
```

## Step 1: Build with Logging Enabled

The code already has extensive logging added. Build the app:

```bash
cd example
npm run android
```

## Step 2: Monitor Logs

In a separate terminal, run:

```bash
adb logcat | grep -E "TrueSheetViewManager|TrueSheetRootView|TrueSheet"
```

Or filter more specifically:

```bash
adb logcat *:S TrueSheetViewManager:D TrueSheetRootView:D TrueSheet:D
```

## Step 3: Expected Log Output

### When ViewManager is Instantiated
```
D/TrueSheetViewManager: TrueSheetViewManager instantiated
D/TrueSheetViewManager: Delegate: TrueSheetViewManagerDelegate@abc123
```

### When View is Created
```
D/TrueSheetViewManager: createViewInstance called
D/TrueSheet: setting id: 123
```

### If updateState IS Called (Expected)
```
D/TrueSheetViewManager: updateState called! ViewId: 123
D/TrueSheetViewManager: StateWrapper: StateWrapper@xyz789
D/TrueSheetViewManager: Props: ...
D/TrueSheet: setting stateWrapper
```

### If updateState IS NOT Called (Problem)
```
(No updateState logs appear)
```

### When Sheet Opens and Dimensions Change
```
D/TrueSheetRootView: updateState called - width: 392.0, height: 800.0
D/TrueSheetRootView: stateWrapper is: NOT NULL (StateWrapper@xyz789)
D/TrueSheetRootView: Calling stateWrapper.updateState()
D/TrueSheetRootView: stateWrapper.updateState() completed successfully
```

### If StateWrapper is NULL (Problem)
```
D/TrueSheetRootView: updateState called - width: 392.0, height: 800.0
D/TrueSheetRootView: stateWrapper is: NULL
W/TrueSheetRootView: stateWrapper is NULL - cannot update state!
```

## Step 4: Interpret Results

### Scenario A: updateState IS Called ✅
- ViewManager's `updateState()` logs appear
- StateWrapper is passed correctly
- TrueSheetRootView can update state
- **Result:** Everything works as expected!

### Scenario B: updateState NOT Called, StateWrapper NULL ❌
- No ViewManager `updateState()` logs
- TrueSheetRootView shows "stateWrapper is NULL"
- **Problem:** Fabric is not recognizing component has state

### Scenario C: updateState NOT Called, StateWrapper NOT NULL ⚠️
- No ViewManager `updateState()` logs
- But TrueSheetRootView has valid StateWrapper
- **Result:** StateWrapper is being set through another path

## Step 5: Additional Debugging

### Check if Delegate is Being Used

Add this to any prop setter:

```kotlin
@ReactProp(name = "detents")
override fun setDetents(view: TrueSheetView, detents: ReadableArray?) {
  android.util.Log.d("TrueSheetViewManager", "setDetents called via delegate")
  // ... rest of method
}
```

### Check Component Registration

```bash
adb logcat | grep "ReactModule"
```

Look for:
```
ReactModule: Registering TrueSheetView
```

### Verify Codegen Output

Check if state files were generated:

```bash
find android/build/generated -name "States.h" -o -name "States.cpp"
```

Check contents:
```bash
cat android/build/generated/source/codegen/jni/react/renderer/components/TrueSheetSpec/States.h
```

Expected:
```cpp
using TrueSheetViewState = StateData;
```

## Understanding the Issue

### Why updateState Might Not Be Called

1. **No C++ State Definition**
   - Fabric expects state to be defined in C++ (like Modal)
   - TypeScript interface alone is not enough
   - Codegen generates `StateData` (generic) instead of custom state

2. **Codegen Limitation**
   - `codegenNativeComponent<Props>` doesn't accept state parameter in TypeScript
   - State must be defined in C++ headers or through specific codegen patterns

3. **Fabric Optimization**
   - If no state is registered, Fabric skips `updateState()` calls
   - StateWrapper might be created but not passed through ViewManager

### How Modal Does It

Modal defines state in C++:
```cpp
// ModalHostViewState.h
class ModalHostViewState {
  Size screenSize{};
};
```

This is NOT in the JavaScript/TypeScript spec - it's pure C++.

## Solutions

### Option 1: Accept Current Behavior (Recommended)

If StateWrapper works even without ViewManager's `updateState()` being called:
- StateWrapper might be injected through Fabric's internal paths
- Direct `stateWrapper.updateState()` calls work fine
- No changes needed

### Option 2: Define State in C++ (Advanced)

Create C++ state class:
1. Add `TrueSheetViewState.h` to iOS/Android C++ layer
2. Define state structure
3. Update ComponentDescriptor
4. Regenerate codegen

**Complexity:** High  
**Benefit:** Full Fabric integration  
**Required for:** Official React Native component

### Option 3: Remove State Dependency (Alternative)

If state isn't needed:
1. Remove state-dependent features
2. Use props/events only
3. Simplify architecture

## Conclusion

After running these tests, you'll know:
- ✅ Is `updateState()` being called?
- ✅ Is StateWrapper available?
- ✅ Can dimensions be tracked?

The most important question: **Does the sheet work correctly regardless?**

If the sheet functions properly, the ViewManager's `updateState()` not being called might be acceptable - it just means Fabric is handling state through internal paths rather than the ViewManager callback.