# Fabric Compliance Refactoring - Action Plan

**Project**: `@lodev09/react-native-true-sheet`  
**Date**: November 15, 2024  
**Priority**: 🔴 HIGH  
**Status**: 📋 PLANNING

---

## 🎯 Objective

Refactor the iOS Fabric implementation to follow React Native best practices by removing Promise-based commands and adopting a pure event-driven architecture.

---

## 🔍 Issues to Address

### Critical Issues
1. ❌ Commands using Promises (violates Fabric architecture)
2. ❌ Misleading `async` methods in JavaScript API
3. ❌ Mixed Paper/Fabric patterns

### Impact
- **API Breaking**: Yes, removing `async` is a breaking change
- **User Impact**: Medium - users need to switch from promises to events
- **Technical Debt**: High - current pattern violates architectural principles

---

## 📋 Refactoring Phases

### Phase 1: Internal Refactoring (Non-Breaking) ✅ RECOMMENDED FIRST

**Goal**: Fix internal implementation while maintaining backward compatibility

#### Step 1.1: Create New Internal Methods

**File**: `ios/TrueSheetViewComponentView.mm`

```objc
// Add new internal methods (fire-and-forget)
- (void)presentAtIndex:(NSInteger)index animated:(BOOL)animated {
    if (_isPresented) {
        [_controller resizeToIndex:index];
        return;
    }
    
    UIViewController *rootViewController = [self _findPresentingViewController];
    if (!rootViewController) {
        NSLog(@"[TrueSheet] Error: No root view controller found");
        return;
    }
    
    _isPresented = YES;
    _activeIndex = @(index);
    
    [rootViewController presentViewController:_controller animated:animated completion:^{
        [self->_controller resizeToIndex:index];
        
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

- (void)dismissAnimated:(BOOL)animated {
    if (!_isPresented) {
        return;
    }
    
    [_controller dismissViewControllerAnimated:animated completion:nil];
}
```

#### Step 1.2: Update Commands Protocol

```objc
#pragma mark - RCTTrueSheetViewViewProtocol (Commands)

- (void)present:(NSInteger)index {
    [self presentAtIndex:index animated:YES];
}

- (void)dismiss {
    [self dismissAnimated:YES];
}
```

#### Step 1.3: Keep Legacy Methods as Deprecated

```objc
// Deprecated: Keep for backward compatibility, will be removed in v3.0.0
- (void)presentAtIndex:(NSInteger)index 
               resolve:(RCTPromiseResolveBlock)resolve 
                reject:(RCTPromiseRejectBlock)reject {
    NSLog(@"[TrueSheet] Warning: Promise-based present is deprecated. Use events instead.");
    [self presentAtIndex:index animated:YES];
    if (resolve) resolve(nil);
}

- (void)dismissWithResolve:(RCTPromiseResolveBlock)resolve 
                    reject:(RCTPromiseRejectBlock)reject {
    NSLog(@"[TrueSheet] Warning: Promise-based dismiss is deprecated. Use events instead.");
    [self dismissAnimated:YES];
    if (resolve) resolve(nil);
}
```

**Status**: ✅ Ready to implement  
**Breaking**: No  
**Estimated Time**: 1 hour

---

### Phase 2: JavaScript API Update (Non-Breaking) ✅ RECOMMENDED SECOND

**Goal**: Add new event-based API alongside existing one

#### Step 2.1: Add New Sync Methods

**File**: `src/TrueSheet.tsx`

```typescript
/**
 * Present the sheet by given name (sync, use events for completion)
 * @param name - Sheet name
 * @param index - Size index
 * @example
 * TrueSheet.show('mySheet', 0)
 * // Listen to onPresent event for completion
 */
public static show(name: string, index: number = 0): void {
    const ref = TrueSheet.getRef(name)
    if (!ref) return
    Commands.present(ref, index)
}

/**
 * Dismiss the sheet by given name (sync, use events for completion)
 * @param name - Sheet name
 * @example
 * TrueSheet.hide('mySheet')
 * // Listen to onDismiss event for completion
 */
public static hide(name: string): void {
    const ref = TrueSheet.getRef(name)
    if (!ref) return
    Commands.dismiss(ref)
}
```

#### Step 2.2: Deprecate Async Methods

```typescript
/**
 * @deprecated Use show() instead. Will be removed in v3.0.0
 * Present the sheet by given name
 */
public static async present(name: string, index: number = 0): Promise<void> {
    console.warn('[TrueSheet] present() is deprecated. Use show() and listen to onPresent event.')
    const ref = TrueSheet.getRef(name)
    if (!ref) return
    Commands.present(ref, index)
}

/**
 * @deprecated Use hide() instead. Will be removed in v3.0.0
 * Dismiss the sheet by given name
 */
public static async dismiss(name: string): Promise<void> {
    console.warn('[TrueSheet] dismiss() is deprecated. Use hide() and listen to onDismiss event.')
    const ref = TrueSheet.getRef(name)
    if (!ref) return
    Commands.dismiss(ref)
}
```

#### Step 2.3: Update TypeScript Definitions

**File**: `src/TrueSheet.types.ts`

Add deprecation notes:

```typescript
export interface TrueSheetStatic {
  /**
   * Present a sheet by name (sync, use events for completion)
   * @param name - Sheet name
   * @param index - Size index (default: 0)
   */
  show(name: string, index?: number): void
  
  /**
   * Dismiss a sheet by name (sync, use events for completion)
   * @param name - Sheet name
   */
  hide(name: string): void
  
  /**
   * @deprecated Use show() instead
   */
  present(name: string, index?: number): Promise<void>
  
  /**
   * @deprecated Use hide() instead
   */
  dismiss(name: string): Promise<void>
  
  /**
   * @deprecated Use show() instead
   */
  resize(name: string, index: number): Promise<void>
}
```

**Status**: ✅ Ready to implement  
**Breaking**: No (adds new API)  
**Estimated Time**: 2 hours

---

### Phase 3: Documentation Update (Non-Breaking) ✅ RECOMMENDED THIRD

**Goal**: Update all documentation to show new patterns

#### Step 3.1: Update README.md

```markdown
## Usage

### Presenting a Sheet

```tsx
import { TrueSheet } from '@lodev09/react-native-true-sheet'

// Show the sheet
TrueSheet.show('mySheet', 0)

// Listen for completion
<TrueSheet
  name="mySheet"
  onPresent={(event) => {
    console.log('Sheet presented:', event.nativeEvent)
  }}
>
  {/* content */}
</TrueSheet>
```

### Dismissing a Sheet

```tsx
// Hide the sheet
TrueSheet.hide('mySheet')

// Listen for dismissal
<TrueSheet
  name="mySheet"
  onDismiss={() => {
    console.log('Sheet dismissed')
  }}
>
  {/* content */}
</TrueSheet>
```

### Deprecated API (v2.x)

The promise-based API is deprecated and will be removed in v3.0:

```tsx
// ❌ Deprecated (still works but will be removed)
await TrueSheet.present('mySheet', 0)
await TrueSheet.dismiss('mySheet')

// ✅ Use this instead
TrueSheet.show('mySheet', 0)
TrueSheet.hide('mySheet')
```
```

#### Step 3.2: Create Migration Guide

**File**: `docs/MIGRATION_V3.md`

```markdown
# Migration Guide: v2.x to v3.0

## Overview

Version 3.0 removes the deprecated promise-based API in favor of the event-driven Fabric architecture.

## Breaking Changes

### Command Methods No Longer Async

**Before (v2.x)**:
```typescript
await TrueSheet.present('mySheet', 0)
console.log('Presented')

await TrueSheet.dismiss('mySheet')
console.log('Dismissed')
```

**After (v3.0)**:
```typescript
TrueSheet.show('mySheet', 0)
// Use events for completion

TrueSheet.hide('mySheet')
// Use events for dismissal
```

### Using Events for Callbacks

```tsx
<TrueSheet
  name="mySheet"
  onPresent={(event) => {
    console.log('Presented at index:', event.nativeEvent.index)
  }}
  onDismiss={() => {
    console.log('Dismissed')
  }}
  onSizeChange={(event) => {
    console.log('Size changed:', event.nativeEvent)
  }}
>
  {/* content */}
</TrueSheet>
```

## Migration Checklist

- [ ] Replace `await TrueSheet.present()` with `TrueSheet.show()`
- [ ] Replace `await TrueSheet.dismiss()` with `TrueSheet.hide()`
- [ ] Replace `await TrueSheet.resize()` with `TrueSheet.show()`
- [ ] Add event listeners for completion callbacks
- [ ] Remove `async/await` from sheet operations
- [ ] Test all sheet interactions

## Why This Change?

React Native's Fabric architecture uses a unidirectional data flow where:
- Commands trigger actions (fire-and-forget)
- Events report state changes
- Promises are not supported in commands

This aligns with React Native best practices and future-proofs the library.
```

**Status**: ✅ Ready to implement  
**Breaking**: No  
**Estimated Time**: 2 hours

---

### Phase 4: Testing & Validation (Non-Breaking) ✅ RECOMMENDED FOURTH

#### Step 4.1: Update Example App

Update all example usage to use new API:

```tsx
// Before
const handlePress = async () => {
  await TrueSheet.present('mySheet', 0)
}

// After
const handlePress = () => {
  TrueSheet.show('mySheet', 0)
}

// Add event handlers
<TrueSheet
  name="mySheet"
  onPresent={() => console.log('Presented')}
  onDismiss={() => console.log('Dismissed')}
>
  {/* content */}
</TrueSheet>
```

#### Step 4.2: Add Tests

```typescript
describe('TrueSheet Commands', () => {
  it('should present without returning promise', () => {
    const result = TrueSheet.show('test', 0)
    expect(result).toBeUndefined()
  })
  
  it('should dismiss without returning promise', () => {
    const result = TrueSheet.hide('test')
    expect(result).toBeUndefined()
  })
  
  it('should emit onPresent event', (done) => {
    const onPresent = jest.fn(() => done())
    // Test implementation
  })
})
```

**Status**: ✅ Ready to implement  
**Breaking**: No  
**Estimated Time**: 3 hours

---

### Phase 5: Version 2.2.0 Release (Non-Breaking) ✅ RECOMMENDED RELEASE

**Goal**: Ship new API with deprecation warnings

#### Release Checklist

- [ ] All Phase 1-4 changes complete
- [ ] Example app updated
- [ ] Documentation updated
- [ ] Tests passing
- [ ] Deprecation warnings in place
- [ ] Migration guide published
- [ ] CHANGELOG updated

#### Release Notes

```markdown
## v2.2.0 - Fabric Compliance Update

### New Features
- ✨ Added `show()` method (replaces `present()`)
- ✨ Added `hide()` method (replaces `dismiss()`)
- ✨ Event-driven architecture aligned with Fabric best practices

### Deprecated
- ⚠️ `present()` - Use `show()` instead
- ⚠️ `dismiss()` - Use `hide()` instead  
- ⚠️ `resize()` - Use `show()` instead

### Migration
See [MIGRATION_V3.md](docs/MIGRATION_V3.md) for details.

### Non-Breaking
All deprecated methods still work and will be removed in v3.0.0.
```

**Status**: ✅ Ready to plan  
**Estimated Time**: 1 hour for release prep

---

### Phase 6: Version 3.0.0 Release (BREAKING) ⏰ FUTURE

**Goal**: Remove all deprecated code

#### Step 6.1: Remove Deprecated Native Methods

**File**: `ios/TrueSheetViewComponentView.h`

```objc
// Remove RCTBridgeModule import
// Remove promise-based method declarations
```

**File**: `ios/TrueSheetViewComponentView.mm`

```objc
// Remove presentAtIndex:resolve:reject:
// Remove dismissWithResolve:reject:
```

#### Step 6.2: Remove Deprecated JavaScript Methods

**File**: `src/TrueSheet.tsx`

```typescript
// Remove present()
// Remove dismiss()
// Remove resize()
// Only keep show() and hide()
```

#### Step 6.3: Update All Documentation

Remove all references to deprecated API.

**Status**: 🚫 DO NOT START YET  
**Timing**: After v2.2.0 has been stable for 3+ months  
**Estimated Time**: 2 hours

---

## 📊 Timeline

| Phase | Task | Duration | Breaking | Status |
|-------|------|----------|----------|--------|
| 1 | Internal refactoring | 1 hour | No | 📋 Ready |
| 2 | JavaScript API | 2 hours | No | 📋 Ready |
| 3 | Documentation | 2 hours | No | 📋 Ready |
| 4 | Testing | 3 hours | No | 📋 Ready |
| 5 | v2.2.0 Release | 1 hour | No | 📋 Ready |
| 6 | v3.0.0 Release | 2 hours | Yes | ⏰ Future |

**Total Time (Phase 1-5)**: ~9 hours  
**Total Time (Phase 1-6)**: ~11 hours

---

## 🎯 Success Criteria

### Phase 1-5 Success
- ✅ New API works correctly
- ✅ Old API still works with warnings
- ✅ All tests pass
- ✅ Documentation complete
- ✅ Example app uses new API
- ✅ No regressions

### Phase 6 Success  
- ✅ Clean Fabric-compliant implementation
- ✅ No promise-based code
- ✅ Pure event-driven architecture
- ✅ All deprecated code removed
- ✅ Users successfully migrated

---

## 🔄 Rollback Plan

If issues are discovered:

### For Phase 1-5
- Warnings can be removed
- New methods can be marked experimental
- Old API continues working

### For Phase 6
- Revert commit
- Release v3.0.1 with old API restored
- Extend deprecation period

---

## 📝 Communication Plan

### v2.2.0 Announcement

```markdown
🎉 TrueSheet v2.2.0 - Fabric Best Practices

We've added new methods that align with React Native Fabric architecture:
- Use `show()` instead of `present()`
- Use `hide()` instead of `dismiss()`
- Listen to events for completion

The old API still works but will be removed in v3.0.0.

See migration guide: [link]
```

### v3.0.0 Announcement (Future)

```markdown
🚀 TrueSheet v3.0.0 - Pure Fabric Implementation

Breaking Changes:
- Removed deprecated promise-based API
- Use event-driven pattern

Migration guide: [link]
Upgrade assistance: [link]
```

---

## 🤔 Decision Points

### Option A: Aggressive Timeline (Recommended)
- v2.2.0 now (with new API)
- v3.0.0 in 3 months

**Pros**: Faster adoption of best practices  
**Cons**: Users have less time to migrate

### Option B: Conservative Timeline
- v2.2.0 now (with new API)
- v3.0.0 in 6-12 months

**Pros**: More time for users to migrate  
**Cons**: Technical debt persists longer

### Recommendation
**Option A** - Ship v2.2.0 immediately, v3.0.0 in 3 months. Most users can migrate quickly.

---

## 📚 Resources

- [React Native Fabric Commands](https://reactnative.dev/docs/the-new-architecture/pillars-fabric-components#commands)
- [Fabric Events](https://reactnative.dev/docs/the-new-architecture/pillars-codegen#events)
- [Migration Best Practices](https://reactnative.dev/docs/the-new-architecture/backward-compatibility)

---

## ✅ Next Steps

1. **Review this plan** with stakeholders
2. **Start Phase 1** - Internal refactoring
3. **Continue through Phase 5** - Ship v2.2.0
4. **Monitor adoption** - Track usage of new API
5. **Plan Phase 6** - Schedule v3.0.0

---

*Plan created: November 15, 2024*  
*Status: Ready for implementation*  
*Priority: High - Should start immediately*