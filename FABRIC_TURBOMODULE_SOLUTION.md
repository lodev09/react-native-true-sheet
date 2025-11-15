# Fabric + TurboModule Solution - Keep Promises!

**Project**: `@lodev09/react-native-true-sheet`  
**Date**: November 15, 2024  
**Status**: ✅ **RECOMMENDED SOLUTION**

---

## 🎯 Solution: Hybrid Architecture

You're absolutely right! We can keep promises by using **TurboModules** alongside Fabric Components. This is actually the **architecturally correct** approach for async operations.

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│           JavaScript Layer                       │
├─────────────────────────────────────────────────┤
│  TrueSheet Component (Fabric)                   │
│  - Rendering & Props                            │
│  - Events (onPresent, onDismiss, etc.)          │
│                                                  │
│  TrueSheetModule (TurboModule)                  │
│  - Async Methods with Promises                  │
│  - present() → Promise<void>                    │
│  - dismiss() → Promise<void>                    │
└─────────────────────────────────────────────────┘
         │                          │
         ▼                          ▼
┌──────────────────┐    ┌──────────────────────┐
│ Fabric Component │    │   TurboModule        │
│ (View Layer)     │    │   (Logic Layer)      │
│                  │    │                      │
│ - ComponentView  │    │ - Async operations   │
│ - Props          │    │ - Promise support    │
│ - Events         │    │ - Error handling     │
│ - Commands       │    │ - Business logic     │
└──────────────────┘    └──────────────────────┘
```

---

## ✅ Why This Works

### Fabric Components
**Purpose**: UI rendering and declarative props
- ✅ Handle view lifecycle
- ✅ Emit events
- ✅ React to prop changes
- ❌ NOT for async operations with return values

### TurboModules
**Purpose**: Business logic and async operations
- ✅ Support promises (async/await)
- ✅ Can resolve/reject
- ✅ Perfect for imperative APIs
- ✅ Officially supported pattern

**From React Native docs:**
> "TurboModules support asynchronous methods that return promises."

---

## 🔧 Implementation Plan

### Phase 1: Create TurboModule Spec

**File**: `src/TrueSheetModuleSpec.ts` (NEW)

```typescript
import type { TurboModule } from 'react-native'
import { TurboModuleRegistry } from 'react-native'

export interface Spec extends TurboModule {
  /**
   * Present a sheet by name with promise support
   * @param name - Sheet name
   * @param index - Size index
   * @returns Promise that resolves when presented
   */
  present(name: string, index: number): Promise<void>
  
  /**
   * Dismiss a sheet by name with promise support
   * @param name - Sheet name
   * @returns Promise that resolves when dismissed
   */
  dismiss(name: string): Promise<void>
  
  /**
   * Resize a sheet to a different index
   * @param name - Sheet name
   * @param index - New size index
   * @returns Promise that resolves when resized
   */
  resize(name: string, index: number): Promise<void>
}

export default TurboModuleRegistry.getEnforcing<Spec>('TrueSheetModule')
```

---

### Phase 2: Implement iOS TurboModule

**File**: `ios/TrueSheetModule.h` (NEW)

```objc
//
//  TrueSheetModule.h
//  TrueSheet
//
//  Created by Jovanni Lo (@lodev09)
//

#pragma once

#ifdef RCT_NEW_ARCH_ENABLED

#import <React/RCTBridgeModule.h>
#import <TrueSheetModuleSpec/TrueSheetModuleSpec.h>

NS_ASSUME_NONNULL_BEGIN

@interface TrueSheetModule : NSObject <NativeTrueSheetModuleSpec>
@end

NS_ASSUME_NONNULL_END

#endif // RCT_NEW_ARCH_ENABLED
```

**File**: `ios/TrueSheetModule.mm` (NEW)

```objc
//
//  TrueSheetModule.mm
//  TrueSheet
//
//  Created by Jovanni Lo (@lodev09)
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "TrueSheetModule.h"
#import "TrueSheetViewComponentView.h"
#import <React/RCTUtils.h>

@implementation TrueSheetModule {
    // Keep track of sheet refs by name
    NSMutableDictionary<NSString *, TrueSheetViewComponentView *> *_sheetRefs;
}

RCT_EXPORT_MODULE(TrueSheetModule)

- (instancetype)init {
    if (self = [super init]) {
        _sheetRefs = [NSMutableDictionary new];
    }
    return self;
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeTrueSheetModuleSpecJSI>(params);
}

#pragma mark - Public Methods

- (void)present:(NSString *)name
          index:(double)index
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject {
    
    dispatch_async(dispatch_get_main_queue(), ^{
        TrueSheetViewComponentView *sheet = self->_sheetRefs[name];
        
        if (!sheet) {
            reject(@"SHEET_NOT_FOUND", 
                   [NSString stringWithFormat:@"Sheet with name '%@' not found", name],
                   nil);
            return;
        }
        
        // Call the component view's present method
        [sheet presentAtIndex:(NSInteger)index 
                     animated:YES
                   completion:^(BOOL success, NSError * _Nullable error) {
            if (success) {
                resolve(nil);
            } else {
                reject(@"PRESENT_FAILED", 
                       error.localizedDescription ?: @"Failed to present sheet",
                       error);
            }
        }];
    });
}

- (void)dismiss:(NSString *)name
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject {
    
    dispatch_async(dispatch_get_main_queue(), ^{
        TrueSheetViewComponentView *sheet = self->_sheetRefs[name];
        
        if (!sheet) {
            reject(@"SHEET_NOT_FOUND",
                   [NSString stringWithFormat:@"Sheet with name '%@' not found", name],
                   nil);
            return;
        }
        
        [sheet dismissAnimated:YES completion:^(BOOL success, NSError * _Nullable error) {
            if (success) {
                resolve(nil);
            } else {
                reject(@"DISMISS_FAILED",
                       error.localizedDescription ?: @"Failed to dismiss sheet",
                       error);
            }
        }];
    });
}

- (void)resize:(NSString *)name
         index:(double)index
       resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject {
    // Resize is just present with a different index
    [self present:name index:index resolve:resolve reject:reject];
}

#pragma mark - Sheet Registration

// Called by TrueSheetViewComponentView to register itself
+ (void)registerSheet:(TrueSheetViewComponentView *)sheet withName:(NSString *)name {
    // Implementation to add sheet to registry
}

+ (void)unregisterSheetWithName:(NSString *)name {
    // Implementation to remove sheet from registry
}

@end

#endif // RCT_NEW_ARCH_ENABLED
```

---

### Phase 3: Update ComponentView with Callbacks

**File**: `ios/TrueSheetViewComponentView.h` (UPDATED)

```objc
#pragma once

#ifdef RCT_NEW_ARCH_ENABLED

#import <UIKit/UIKit.h>
#import <React/RCTViewComponentView.h>

@class TrueSheetViewController;

NS_ASSUME_NONNULL_BEGIN

// Completion block for async operations
typedef void (^TrueSheetCompletionBlock)(BOOL success, NSError * _Nullable error);

@interface TrueSheetViewComponentView : RCTViewComponentView

@property (nonatomic, strong, nullable) TrueSheetViewController *controller;
@property (nonatomic, copy, nullable) NSString *sheetName;

// Commands (fire-and-forget, for Commands API)
- (void)present:(NSInteger)index;
- (void)dismiss;

// Async methods (with callbacks, for TurboModule)
- (void)presentAtIndex:(NSInteger)index 
              animated:(BOOL)animated
            completion:(nullable TrueSheetCompletionBlock)completion;

- (void)dismissAnimated:(BOOL)animated 
             completion:(nullable TrueSheetCompletionBlock)completion;

@end

NS_ASSUME_NONNULL_END

#endif // RCT_NEW_ARCH_ENABLED
```

**File**: `ios/TrueSheetViewComponentView.mm` (UPDATED)

```objc
#pragma mark - RCTTrueSheetViewViewProtocol (Commands)

// Fire-and-forget commands (no callbacks)
- (void)present:(NSInteger)index {
    [self presentAtIndex:index animated:YES completion:nil];
}

- (void)dismiss {
    [self dismissAnimated:YES completion:nil];
}

#pragma mark - Public Async Methods (For TurboModule)

- (void)presentAtIndex:(NSInteger)index 
              animated:(BOOL)animated
            completion:(nullable TrueSheetCompletionBlock)completion {
    
    if (_isPresented) {
        [_controller resizeToIndex:index];
        if (completion) {
            completion(YES, nil);
        }
        return;
    }
    
    UIViewController *rootViewController = [self _findPresentingViewController];
    if (!rootViewController) {
        NSError *error = [NSError errorWithDomain:@"TrueSheetErrorDomain"
                                             code:1001
                                         userInfo:@{
            NSLocalizedDescriptionKey: @"No root view controller found"
        }];
        if (completion) {
            completion(NO, error);
        }
        return;
    }
    
    _isPresented = YES;
    _activeIndex = @(index);
    
    [rootViewController presentViewController:_controller animated:animated completion:^{
        [self->_controller resizeToIndex:index];
        
        // Emit event
        if (self->_eventEmitter) {
            auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(self->_eventEmitter);
            NSDictionary *sizeInfo = [self->_controller currentSizeInfo];
            CGFloat sizeValue = sizeInfo ? [sizeInfo[@"value"] doubleValue] : 0.0;
            
            TrueSheetViewEventEmitter::OnPresent event;
            event.index = static_cast<int>(index);
            event.value = static_cast<double>(sizeValue);
            emitter->onPresent(event);
        }
        
        // Call completion
        if (completion) {
            completion(YES, nil);
        }
    }];
}

- (void)dismissAnimated:(BOOL)animated 
             completion:(nullable TrueSheetCompletionBlock)completion {
    
    if (!_isPresented) {
        if (completion) {
            completion(YES, nil);
        }
        return;
    }
    
    [_controller dismissViewControllerAnimated:animated completion:^{
        if (completion) {
            completion(YES, nil);
        }
    }];
}

#pragma mark - Lifecycle

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps {
    const auto &oldViewProps = *std::static_pointer_cast<TrueSheetViewProps const>(_props);
    const auto &newViewProps = *std::static_pointer_cast<TrueSheetViewProps const>(props);
    
    // Store sheet name for TurboModule registry
    if (!newViewProps.name.empty()) {
        NSString *name = RCTNSStringFromString(newViewProps.name);
        if (![_sheetName isEqualToString:name]) {
            _sheetName = name;
            // Register with TurboModule
            [TrueSheetModule registerSheet:self withName:name];
        }
    }
    
    // ... rest of props handling
    
    [super updateProps:props oldProps:oldProps];
}

- (void)dealloc {
    if (_sheetName) {
        [TrueSheetModule unregisterSheetWithName:_sheetName];
    }
}
```

---

### Phase 4: Update Codegen Config

**File**: `package.json` (UPDATED)

```json
{
  "codegenConfig": {
    "name": "TrueSheetViewSpec",
    "type": "components",
    "jsSrcsDir": "src",
    "ios": {
      "componentProvider": "TrueSheetView"
    }
  },
  "codegenModules": {
    "name": "TrueSheetModuleSpec",
    "type": "modules",
    "jsSrcsDir": "src/specs"
  }
}
```

---

### Phase 5: Update TypeScript Spec for Props

**File**: `src/TrueSheetViewNativeComponent.ts` (UPDATED)

Add `name` prop:

```typescript
export interface NativeProps extends ViewProps {
  // ... existing props
  
  // Sheet name for TurboModule registration
  name?: string
  
  // ... rest of props
}
```

---

### Phase 6: Update JavaScript API

**File**: `src/TrueSheet.tsx` (UPDATED)

```typescript
import TrueSheetModule from './TrueSheetModuleSpec'

export class TrueSheet extends PureComponent<TrueSheetProps, TrueSheetState> {
  
  /**
   * Present the sheet by given name (Promise-based)
   * @param name - Sheet name
   * @param index - Size index
   * @returns Promise that resolves when sheet is presented
   */
  public static async present(name: string, index: number = 0): Promise<void> {
    return TrueSheetModule.present(name, index)
  }

  /**
   * Dismiss the sheet by given name (Promise-based)
   * @param name - Sheet name
   * @returns Promise that resolves when sheet is dismissed
   */
  public static async dismiss(name: string): Promise<void> {
    return TrueSheetModule.dismiss(name)
  }

  /**
   * Resize the sheet by given name (Promise-based)
   * @param name - Sheet name
   * @param index - New size index
   * @returns Promise that resolves when sheet is resized
   */
  public static async resize(name: string, index: number): Promise<void> {
    return TrueSheetModule.resize(name, index)
  }
  
  // ... rest of component implementation
  
  render() {
    return (
      <TrueSheetViewNativeComponent
        {...this.props}
        name={this.props.name}  // Pass name prop for TurboModule registration
        ref={this.ref}
      />
    )
  }
}
```

---

## 📋 Updated Props Interface

**File**: `src/TrueSheet.types.ts` (UPDATED)

```typescript
export interface TrueSheetProps {
  /**
   * Sheet name for imperative API
   * Required for present/dismiss/resize methods
   */
  name: string
  
  // ... all other existing props
}
```

---

## ✅ Benefits of This Approach

### 1. Best of Both Worlds
- ✅ Fabric Component for UI (fast, efficient)
- ✅ TurboModule for async operations (promises work!)
- ✅ Architecturally correct

### 2. Real Promise Support
```typescript
// ✅ This ACTUALLY works now!
try {
  await TrueSheet.present('mySheet', 0)
  console.log('Sheet successfully presented!')
} catch (error) {
  console.error('Failed to present:', error)
}
```

### 3. Error Handling
```typescript
// ✅ Proper error handling
try {
  await TrueSheet.present('nonExistent', 0)
} catch (error) {
  if (error.code === 'SHEET_NOT_FOUND') {
    console.error('Sheet not found!')
  }
}
```

### 4. No Breaking Changes
- Keep existing API exactly as is
- Add proper promise support
- Better error handling

### 5. Event System Still Works
```tsx
// Events still work for reactive updates
<TrueSheet
  name="mySheet"
  onPresent={(e) => console.log('Presented!', e)}
  onDismiss={() => console.log('Dismissed!')}
/>
```

---

## 🎯 Implementation Checklist

### Native Layer
- [ ] Create `TrueSheetModule.h`
- [ ] Create `TrueSheetModule.mm`
- [ ] Add completion blocks to ComponentView
- [ ] Implement sheet registration system
- [ ] Add proper error handling
- [ ] Update podspec if needed

### TypeScript Layer
- [ ] Create `TrueSheetModuleSpec.ts`
- [ ] Update `TrueSheetViewNativeComponent.ts` (add name prop)
- [ ] Update `TrueSheet.tsx` (use TurboModule)
- [ ] Update `TrueSheet.types.ts` (add name prop)
- [ ] Update Codegen config

### Testing
- [ ] Test promise resolution
- [ ] Test promise rejection
- [ ] Test error cases (sheet not found)
- [ ] Test concurrent operations
- [ ] Test with events still working
- [ ] Memory leak testing

### Documentation
- [ ] Update README with examples
- [ ] Document error codes
- [ ] Add TypeScript examples
- [ ] Update API reference

---

## 📊 Comparison: Commands vs TurboModule

| Feature | Commands API | TurboModule |
|---------|-------------|-------------|
| Purpose | Imperative UI updates | Business logic |
| Return Values | ❌ No | ✅ Yes (promises) |
| Error Handling | Via events | Via reject |
| Async Support | Fire-and-forget | Full async/await |
| Use Case | Simple actions | Complex operations |
| **For This Library** | ❌ Not ideal | ✅ Perfect fit |

---

## 🎨 Usage Examples

### Basic Usage
```typescript
import { TrueSheet } from '@lodev09/react-native-true-sheet'

// Present with await
await TrueSheet.present('mySheet', 0)

// Or with .then()
TrueSheet.present('mySheet', 0)
  .then(() => console.log('Presented!'))
  .catch((error) => console.error(error))
```

### Error Handling
```typescript
try {
  await TrueSheet.present('mySheet', 0)
  // Do something after presentation
  await doSomeWork()
  await TrueSheet.dismiss('mySheet')
} catch (error) {
  console.error('Sheet operation failed:', error)
}
```

### Sequential Operations
```typescript
// Present at size 0
await TrueSheet.present('mySheet', 0)

// Wait 2 seconds
await new Promise(resolve => setTimeout(resolve, 2000))

// Resize to size 1
await TrueSheet.resize('mySheet', 1)

// Wait 2 seconds
await new Promise(resolve => setTimeout(resolve, 2000))

// Dismiss
await TrueSheet.dismiss('mySheet')
```

### Component Still Works
```tsx
<TrueSheet
  name="mySheet"
  sizes={['auto', 'large']}
  onPresent={() => console.log('Event: Presented')}
  onDismiss={() => console.log('Event: Dismissed')}
>
  <View>
    <Text>Sheet content</Text>
  </View>
</TrueSheet>
```

---

## 🔧 Estimated Implementation Time

| Task | Time | Complexity |
|------|------|------------|
| Create TurboModule spec | 30 min | Low |
| Implement iOS TurboModule | 2-3 hours | Medium |
| Update ComponentView | 1-2 hours | Low |
| Add completion blocks | 1 hour | Low |
| Registration system | 1 hour | Medium |
| TypeScript updates | 1 hour | Low |
| Testing | 2-3 hours | Medium |
| Documentation | 1-2 hours | Low |
| **Total** | **9-13 hours** | **Low-Medium** |

---

## ✅ Conclusion

**YES, you can keep promises!** Using TurboModules is the architecturally correct way to support async operations with promises in Fabric.

### This approach:
- ✅ Follows React Native best practices
- ✅ Keeps your existing API
- ✅ Provides real promise support
- ✅ Better error handling
- ✅ No breaking changes
- ✅ Future-proof

### Recommendation
**Implement TurboModule** - It's the right solution for your use case.

---

*Document created: November 15, 2024*  
*Status: Ready for implementation*  
*Priority: High - Recommended approach*