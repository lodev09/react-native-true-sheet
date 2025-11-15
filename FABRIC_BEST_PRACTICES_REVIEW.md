# Fabric Best Practices Review - iOS Implementation

**Project**: `@lodev09/react-native-true-sheet`  
**Date**: November 15, 2024  
**Reviewer**: AI Assistant  
**Status**: ⚠️ **ISSUES FOUND - NEEDS REFACTORING**

---

## 🔍 Executive Summary

After a thorough review of the iOS Fabric implementation, **several anti-patterns and violations of Fabric best practices** were identified. While the code compiles and builds successfully, it does not follow the recommended Fabric architecture patterns.

### Critical Issues Found

1. ❌ **Using Promises in Commands** (Critical)
2. ❌ **Mixing Paper and Fabric patterns** (Major)
3. ⚠️ **Async commands without proper event feedback** (Major)
4. ⚠️ **Missing proper error handling** (Moderate)

---

## ❌ Issue #1: Commands with Promises (CRITICAL)

### Current Implementation (WRONG)

**File**: `ios/TrueSheetViewComponentView.h`
```objc
// ❌ WRONG: Commands should NOT use promises
- (void)presentAtIndex:(NSInteger)index 
               resolve:(RCTPromiseResolveBlock)resolve 
                reject:(RCTPromiseRejectBlock)reject;

- (void)dismissWithResolve:(RCTPromiseResolveBlock)resolve 
                    reject:(RCTPromiseRejectBlock)reject;
```

**File**: `ios/TrueSheetViewComponentView.mm`
```objc
// ❌ WRONG: Commands protocol implementation with promises
#pragma mark - RCTTrueSheetViewViewProtocol (Commands)

- (void)present:(NSInteger)index {
    [self presentAtIndex:index animated:YES resolve:nil reject:nil];
}

- (void)dismiss {
    [self dismissWithResolve:nil reject:nil];
}
```

### Why This Is Wrong

**Fabric Commands API does NOT support promises.** Commands are meant to be:
- **Fire-and-forget** operations
- **Synchronous or asynchronous without return values**
- **Non-blocking** imperative calls

From React Native documentation:
> "Commands are unidirectional. They do not have return values. If you need to return a value, use events."

### Impact

1. **Architecture violation**: Mixing Paper (Promise-based) with Fabric (Event-based)
2. **Broken pattern**: The `async` keyword in JavaScript suggests promises work, but they don't
3. **Misleading API**: Users expect promises to resolve/reject, but they're ignored
4. **Future compatibility**: May break in future RN versions

### JavaScript Layer Issue

**File**: `src/TrueSheet.tsx`
```typescript
// ❌ WRONG: Commands don't return promises
public static async present(name: string, index: number = 0) {
    const ref = TrueSheet.getRef(name)
    if (!ref) return

    Commands.present(ref, index)  // This doesn't return a promise!
}

public static async dismiss(name: string) {
    const ref = TrueSheet.getRef(name)
    if (!ref) return

    Commands.dismiss(ref)  // This doesn't return a promise!
}
```

**The `async` keyword is misleading** - the commands don't actually return promises!

---

## ✅ SOLUTION: Proper Fabric Pattern

### Step 1: Update Native Commands (Remove Promises)

**File**: `ios/TrueSheetViewComponentView.h`
```objc
// ✅ CORRECT: Simple imperative commands
@interface TrueSheetViewComponentView : RCTViewComponentView

@property (nonatomic, strong, nullable) TrueSheetViewController *controller;

// No promise parameters!

@end
```

**File**: `ios/TrueSheetViewComponentView.mm`
```objc
// ✅ CORRECT: Commands protocol implementation
#pragma mark - RCTTrueSheetViewViewProtocol (Commands)

- (void)present:(NSInteger)index {
    // Fire and forget
    if (_isPresented) {
        [_controller resizeToIndex:index];
        return;
    }
    
    UIViewController *rootViewController = [self _findPresentingViewController];
    if (!rootViewController) {
        NSLog(@"[TrueSheet] No root view controller found");
        return;
    }
    
    _isPresented = YES;
    _activeIndex = @(index);
    
    [rootViewController presentViewController:_controller animated:YES completion:^{
        [self->_controller resizeToIndex:index];
        
        // Emit event instead of promise
        if (self->_eventEmitter) {
            auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(self->_eventEmitter);
            NSDictionary *sizeInfo = [self->_controller currentSizeInfo];
            CGFloat sizeValue = sizeInfo ? [sizeInfo[@"value"] doubleValue] : 0.0;
            
            TrueSheetViewEventEmitter::OnPresent event;
            event.index = static_cast<int>(index);
            event.value = static_cast<double>(sizeValue);
            emitter->onPresent(event);
        }
    }];
}

- (void)dismiss {
    // Fire and forget
    if (!_isPresented) {
        return;
    }
    
    [_controller dismissViewControllerAnimated:YES completion:nil];
    // Dismiss event will be fired from viewControllerDidDismiss delegate
}
```

### Step 2: Update TypeScript Commands

**File**: `src/TrueSheetViewNativeComponent.ts`
```typescript
// ✅ CORRECT: Commands return void
export interface NativeCommands {
  present: (
    viewRef: React.ElementRef<HostComponent<NativeProps>>, 
    index: Int32
  ) => void  // No promise!
  
  dismiss: (
    viewRef: React.ElementRef<HostComponent<NativeProps>>
  ) => void  // No promise!
}
```

### Step 3: Update JavaScript API

**File**: `src/TrueSheet.tsx`
```typescript
// ✅ CORRECT: Remove async, return void, rely on events
public static present(name: string, index: number = 0): void {
    const ref = TrueSheet.getRef(name)
    if (!ref) return

    Commands.present(ref, index)
    // Users should listen to onPresent event for completion
}

public static dismiss(name: string): void {
    const ref = TrueSheet.getRef(name)
    if (!ref) return

    Commands.dismiss(ref)
    // Users should listen to onDismiss event for completion
}

public static resize(name: string, index: number): void {
    TrueSheet.present(name, index)
    // Users should listen to onSizeChange event
}
```

### Step 4: Update Public Documentation

Users should be informed to use events:

```typescript
// ✅ CORRECT Usage Pattern
import { TrueSheet } from '@lodev09/react-native-true-sheet'

// Present sheet
TrueSheet.present('mySheet', 0)

// Listen for completion via events
<TrueSheet
  name="mySheet"
  onPresent={(event) => {
    console.log('Sheet presented at index:', event.nativeEvent.index)
  }}
  onDismiss={(event) => {
    console.log('Sheet dismissed')
  }}
/>
```

---

## ⚠️ Issue #2: Unnecessary Promise Methods

### Current Implementation

**File**: `ios/TrueSheetViewComponentView.mm`
```objc
// ❌ WRONG: These methods exist but shouldn't
- (void)presentAtIndex:(NSInteger)index 
               resolve:(RCTPromiseResolveBlock)resolve 
                reject:(RCTPromiseRejectBlock)reject {
    // ... implementation with promises
    if (resolve) {
        resolve(nil);
    }
}

- (void)dismissWithResolve:(RCTPromiseResolveBlock)resolve 
                    reject:(RCTPromiseRejectBlock)reject {
    // ... implementation with promises
    if (resolve) {
        resolve(nil);
    }
}
```

### Solution

**Remove these methods entirely.** They serve no purpose in Fabric architecture.

---

## ⚠️ Issue #3: Incomplete Error Handling

### Current Implementation

```objc
UIViewController *rootViewController = [self _findPresentingViewController];
if (!rootViewController) {
    if (reject) {
        reject(@"Error", @"No root view controller found", nil);
    }
    return;
}
```

### Problems

1. The `reject` callback doesn't exist in proper Fabric
2. Errors are silently swallowed
3. No event emitted for error states

### Solution

Emit error events:

```objc
// ✅ CORRECT: Emit error events
UIViewController *rootViewController = [self _findPresentingViewController];
if (!rootViewController) {
    NSLog(@"[TrueSheet] Error: No root view controller found");
    
    // Optionally emit an error event
    if (_eventEmitter) {
        auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(_eventEmitter);
        // Define onError event in TypeScript spec if needed
    }
    return;
}
```

---

## ✅ Issue #4: Good Practices Already Implemented

Despite the issues above, several things are done correctly:

### ✅ Event Emitters (CORRECT)

```objc
// ✅ Using Codegen-generated event emitters
TrueSheetViewEventEmitter::OnPresent event;
event.index = static_cast<int>(index);
event.value = static_cast<double>(sizeValue);
emitter->onPresent(event);
```

### ✅ Props Handling (CORRECT)

```objc
// ✅ Using Codegen-generated Props
const auto &newViewProps = *std::static_pointer_cast<TrueSheetViewProps const>(props);
if (newViewProps.cornerRadius != 0.0) {
    _controller.cornerRadius = @(newViewProps.cornerRadius);
}
```

### ✅ Commands Protocol (CORRECT)

```objc
// ✅ Implementing the protocol
@interface TrueSheetViewComponentView () <RCTTrueSheetViewViewProtocol, TrueSheetViewControllerDelegate>
@end

@implementation TrueSheetViewComponentView (Commands)

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args {
    RCTTrueSheetViewHandleCommand(self, commandName, args);
}

@end
```

### ✅ Lifecycle Methods (CORRECT)

```objc
// ✅ Proper Fabric lifecycle
- (void)invalidate {
    if (_isPresented) {
        [_controller dismissViewControllerAnimated:YES completion:nil];
    }
}

- (void)prepareForRecycle {
    [super prepareForRecycle];
    [self invalidate];
    _isPresented = NO;
    _activeIndex = nil;
}
```

### ✅ Memory Management (CORRECT)

```objc
// ✅ Using C++ shared pointers
const auto &props = *std::static_pointer_cast<TrueSheetViewProps const>(_props);
auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(_eventEmitter);
```

---

## 📋 Refactoring Checklist

### Must Fix (Breaking Changes)

- [ ] Remove `RCTPromiseResolveBlock`/`RCTPromiseRejectBlock` from native methods
- [ ] Remove `presentAtIndex:resolve:reject:` method
- [ ] Remove `dismissWithResolve:reject:` method
- [ ] Update `present:` command to be fire-and-forget
- [ ] Update `dismiss` command to be fire-and-forget
- [ ] Remove `async` from JavaScript `present()` method
- [ ] Remove `async` from JavaScript `dismiss()` method
- [ ] Remove `async` from JavaScript `resize()` method
- [ ] Update documentation to show event-based pattern
- [ ] Add migration guide for users

### Should Fix (Non-Breaking Improvements)

- [ ] Add error event type for failure cases
- [ ] Improve error logging
- [ ] Add TypeScript types for event callbacks
- [ ] Update examples to use events
- [ ] Add JSDoc comments explaining event-based pattern

### Nice to Have

- [ ] Add debug mode for verbose logging
- [ ] Performance instrumentation
- [ ] Better error messages

---

## 📖 Fabric Best Practices Reference

### Commands Should Be:

✅ **Fire-and-forget**: No return values  
✅ **Imperative**: Change state directly  
✅ **Simple**: Minimal parameters  
✅ **Fast**: Non-blocking operations  

### Use Events For:

✅ **Async completion**: When operation finishes  
✅ **State changes**: When state updates  
✅ **Errors**: When operations fail  
✅ **Progress**: For long-running operations  

### Don't Mix:

❌ Promises with Commands  
❌ Paper patterns with Fabric  
❌ Bridge modules with Fabric components  
❌ Legacy callbacks with new architecture  

---

## 🎯 Migration Impact

### Breaking Changes

Users currently using the library like this:

```typescript
// Current (WRONG but appears to work)
await TrueSheet.present('mySheet', 0)
console.log('Sheet is presented')

await TrueSheet.dismiss('mySheet')
console.log('Sheet is dismissed')
```

Will need to change to:

```typescript
// Future (CORRECT)
TrueSheet.present('mySheet', 0)
// Listen to event for completion

<TrueSheet
  name="mySheet"
  onPresent={() => console.log('Sheet is presented')}
  onDismiss={() => console.log('Sheet is dismissed')}
/>
```

### Migration Strategy

1. **Version 2.1.0** (Current): Keep existing API, mark as deprecated
2. **Version 2.2.0** (Next): Add new event-based API alongside old one
3. **Version 3.0.0** (Future): Remove promise-based API completely

---

## 🔧 Recommended Refactoring Order

### Phase 1: Fix Native Implementation (Non-Breaking)
1. Create new internal methods without promises
2. Keep old methods as deprecated wrappers
3. Update commands to call new methods
4. Test thoroughly

### Phase 2: Update JavaScript Layer (Breaking)
1. Add deprecation warnings to async methods
2. Create new sync methods
3. Update documentation
4. Add migration guide

### Phase 3: Remove Legacy Code (Breaking)
1. Remove promise-based methods
2. Remove async keywords
3. Update all examples
4. Release v3.0.0

---

## 📚 References

- [React Native Fabric Commands](https://reactnative.dev/docs/the-new-architecture/pillars-fabric-components#commands)
- [Fabric Best Practices](https://reactnative.dev/docs/the-new-architecture/backward-compatibility)
- [Event Emitters](https://reactnative.dev/docs/the-new-architecture/pillars-codegen#events)

---

## 🎯 Summary

### Current State: ⚠️ FUNCTIONAL BUT NOT BEST PRACTICE

The implementation works but violates Fabric architectural principles by mixing Promise-based (Paper) patterns with the new Fabric architecture.

### Recommended State: ✅ PURE FABRIC IMPLEMENTATION

Commands should be fire-and-forget, with completion/error/state communicated via events.

### Priority: 🔴 HIGH

While not causing immediate issues, this pattern:
- May break in future React Native versions
- Misleads users about API behavior
- Violates documented best practices
- Makes code harder to maintain

---

*Review completed: November 15, 2024*  
*Status: Requires refactoring for proper Fabric compliance*