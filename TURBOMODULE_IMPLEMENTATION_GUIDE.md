# TurboModule Implementation - Quick Start Guide

**Project**: `@lodev09/react-native-true-sheet`  
**Goal**: Add TurboModule for promise-based async API  
**Status**: Ready to implement

---

## 🎯 Overview

This guide provides step-by-step instructions to add a TurboModule alongside your existing Fabric Component to support promises in the imperative API.

**What we're building:**
- ✅ Keep all existing code
- ✅ Add TurboModule for async operations
- ✅ Real promise support (not fake async)
- ✅ Proper error handling
- ✅ Zero breaking changes

---

## 📁 Files to Create

### 1. TurboModule TypeScript Spec

**Path**: `src/specs/NativeTrueSheetModule.ts`

```typescript
/**
 * TurboModule spec for TrueSheet imperative API
 * Provides promise-based async operations
 */
import type { TurboModule } from 'react-native'
import { TurboModuleRegistry } from 'react-native'

export interface Spec extends TurboModule {
  /**
   * Present a sheet by name
   * @param name - Sheet name (must match sheet's name prop)
   * @param index - Size index to present at
   * @returns Promise that resolves when sheet is fully presented
   * @throws SHEET_NOT_FOUND if sheet doesn't exist
   * @throws PRESENT_FAILED if presentation fails
   */
  present(name: string, index: number): Promise<void>
  
  /**
   * Dismiss a sheet by name
   * @param name - Sheet name
   * @returns Promise that resolves when sheet is fully dismissed
   * @throws SHEET_NOT_FOUND if sheet doesn't exist
   * @throws DISMISS_FAILED if dismissal fails
   */
  dismiss(name: string): Promise<void>
  
  /**
   * Resize a sheet to a different index
   * @param name - Sheet name
   * @param index - New size index
   * @returns Promise that resolves when resize is complete
   * @throws SHEET_NOT_FOUND if sheet doesn't exist
   */
  resize(name: string, index: number): Promise<void>
}

export default TurboModuleRegistry.getEnforcing<Spec>('TrueSheetModule')
```

---

### 2. iOS TurboModule Header

**Path**: `ios/TrueSheetModule.h`

```objc
//
//  TrueSheetModule.h
//  TrueSheet
//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#pragma once

#ifdef RCT_NEW_ARCH_ENABLED

#import <React/RCTBridgeModule.h>
#import <NativeTrueSheetModuleSpec/NativeTrueSheetModuleSpec.h>

NS_ASSUME_NONNULL_BEGIN

@class TrueSheetViewComponentView;

/**
 * TurboModule for TrueSheet imperative API
 * Provides promise-based async operations
 */
@interface TrueSheetModule : NSObject <NativeTrueSheetModuleSpec>

/**
 * Register a sheet component view with a name
 * Called automatically when sheet is mounted
 */
+ (void)registerSheet:(TrueSheetViewComponentView *)sheet withName:(NSString *)name;

/**
 * Unregister a sheet component view
 * Called automatically when sheet is unmounted
 */
+ (void)unregisterSheetWithName:(NSString *)name;

/**
 * Get a registered sheet by name
 */
+ (nullable TrueSheetViewComponentView *)getSheetWithName:(NSString *)name;

@end

NS_ASSUME_NONNULL_END

#endif // RCT_NEW_ARCH_ENABLED
```

---

### 3. iOS TurboModule Implementation

**Path**: `ios/TrueSheetModule.mm`

```objc
//
//  TrueSheetModule.mm
//  TrueSheet
//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "TrueSheetModule.h"
#import "TrueSheetViewComponentView.h"
#import <React/RCTUtils.h>

// Shared registry for all sheets
static NSMutableDictionary<NSString *, TrueSheetViewComponentView *> *sheetRegistry;

@implementation TrueSheetModule

RCT_EXPORT_MODULE(TrueSheetModule)

+ (void)initialize {
    if (self == [TrueSheetModule class]) {
        sheetRegistry = [NSMutableDictionary new];
    }
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeTrueSheetModuleSpecJSI>(params);
}

#pragma mark - TurboModule Methods

- (void)present:(NSString *)name
          index:(double)index
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject {
    
    RCTExecuteOnMainQueue(^{
        TrueSheetViewComponentView *sheet = [TrueSheetModule getSheetWithName:name];
        
        if (!sheet) {
            reject(@"SHEET_NOT_FOUND", 
                   [NSString stringWithFormat:@"No sheet found with name '%@'. Make sure the sheet has a 'name' prop.", name],
                   nil);
            return;
        }
        
        // Call the async method with completion
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
    
    RCTExecuteOnMainQueue(^{
        TrueSheetViewComponentView *sheet = [TrueSheetModule getSheetWithName:name];
        
        if (!sheet) {
            reject(@"SHEET_NOT_FOUND",
                   [NSString stringWithFormat:@"No sheet found with name '%@'. Make sure the sheet has a 'name' prop.", name],
                   nil);
            return;
        }
        
        [sheet dismissAnimated:YES 
                    completion:^(BOOL success, NSError * _Nullable error) {
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
    // Resize is just present with different index
    [self present:name index:index resolve:resolve reject:reject];
}

#pragma mark - Sheet Registry

+ (void)registerSheet:(TrueSheetViewComponentView *)sheet withName:(NSString *)name {
    if (!name || name.length == 0) {
        NSLog(@"[TrueSheet] Warning: Attempted to register sheet without a name");
        return;
    }
    
    @synchronized (sheetRegistry) {
        if (sheetRegistry[name] && sheetRegistry[name] != sheet) {
            NSLog(@"[TrueSheet] Warning: Overwriting existing sheet with name '%@'", name);
        }
        sheetRegistry[name] = sheet;
    }
}

+ (void)unregisterSheetWithName:(NSString *)name {
    if (!name || name.length == 0) {
        return;
    }
    
    @synchronized (sheetRegistry) {
        [sheetRegistry removeObjectForKey:name];
    }
}

+ (nullable TrueSheetViewComponentView *)getSheetWithName:(NSString *)name {
    if (!name || name.length == 0) {
        return nil;
    }
    
    @synchronized (sheetRegistry) {
        return sheetRegistry[name];
    }
}

@end

#endif // RCT_NEW_ARCH_ENABLED
```

---

## 📝 Files to Modify

### 4. Update ComponentView Header

**Path**: `ios/TrueSheetViewComponentView.h`

**Add these lines:**

```objc
@class TrueSheetViewController;

NS_ASSUME_NONNULL_BEGIN

// ADD THIS: Completion block typedef
typedef void (^TrueSheetCompletionBlock)(BOOL success, NSError * _Nullable error);

@interface TrueSheetViewComponentView : RCTViewComponentView

@property (nonatomic, strong, nullable) TrueSheetViewController *controller;
// ADD THIS: Store the sheet name
@property (nonatomic, copy, nullable) NSString *sheetName;

// Existing command methods (keep these)
- (void)present:(NSInteger)index;
- (void)dismiss;

// ADD THESE: Async methods with completion blocks
- (void)presentAtIndex:(NSInteger)index 
              animated:(BOOL)animated
            completion:(nullable TrueSheetCompletionBlock)completion;

- (void)dismissAnimated:(BOOL)animated 
             completion:(nullable TrueSheetCompletionBlock)completion;

@end
```

---

### 5. Update ComponentView Implementation

**Path**: `ios/TrueSheetViewComponentView.mm`

**Add these sections:**

#### A. Add import at top:
```objc
#import "TrueSheetModule.h"
```

#### B. Add sheetName property to implementation block:
```objc
@implementation TrueSheetViewComponentView {
    // ... existing properties
    NSString *_sheetName;
}
```

#### C. Update command methods to use new async methods:
```objc
#pragma mark - RCTTrueSheetViewViewProtocol (Commands)

- (void)present:(NSInteger)index {
    [self presentAtIndex:index animated:YES completion:nil];
}

- (void)dismiss {
    [self dismissAnimated:YES completion:nil];
}
```

#### D. Add new async methods:
```objc
#pragma mark - Async Methods (For TurboModule)

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
        NSError *error = [NSError errorWithDomain:@"com.lodev09.TrueSheet"
                                             code:1001
                                         userInfo:@{
            NSLocalizedDescriptionKey: @"No root view controller found"
        }];
        
        NSLog(@"[TrueSheet] Error: No root view controller found");
        
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
        
        // Call completion handler
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
        // Completion handler will be called after dismiss
        if (completion) {
            completion(YES, nil);
        }
    }];
}
```

#### E. Update props handling to register/unregister sheet:
```objc
- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps {
    const auto &oldViewProps = *std::static_pointer_cast<TrueSheetViewProps const>(_props);
    const auto &newViewProps = *std::static_pointer_cast<TrueSheetViewProps const>(props);
    
    // Handle name prop for TurboModule registration
    if (!newViewProps.name.empty()) {
        NSString *name = RCTNSStringFromString(newViewProps.name);
        if (![_sheetName isEqualToString:name]) {
            // Unregister old name
            if (_sheetName) {
                [TrueSheetModule unregisterSheetWithName:_sheetName];
            }
            // Register new name
            _sheetName = name;
            [TrueSheetModule registerSheet:self withName:name];
        }
    }
    
    // ... rest of existing props handling ...
    
    [super updateProps:props oldProps:oldProps];
}
```

#### F. Update dealloc to unregister:
```objc
- (void)dealloc {
    if (_sheetName) {
        [TrueSheetModule unregisterSheetWithName:_sheetName];
    }
    [self invalidate];
}
```

#### G. Add name property getter/setter:
```objc
- (NSString *)sheetName {
    return _sheetName;
}

- (void)setSheetName:(NSString *)sheetName {
    _sheetName = sheetName;
}
```

---

### 6. Update Native Component Spec

**Path**: `src/TrueSheetViewNativeComponent.ts`

**Add name prop:**

```typescript
export interface NativeProps extends ViewProps {
  // ADD THIS: Name for TurboModule registration
  name?: string
  
  // Array properties
  sizes?: ReadonlyArray<string>
  
  // ... rest of existing props ...
}
```

---

### 7. Update TypeScript Component

**Path**: `src/TrueSheet.tsx`

**Import TurboModule and update methods:**

```typescript
// Add import at top
import TrueSheetModule from './specs/NativeTrueSheetModule'

export class TrueSheet extends PureComponent<TrueSheetProps, TrueSheetState> {
  
  /**
   * Present the sheet by given name (Promise-based)
   * @param name - Sheet name (must match sheet's name prop)
   * @param index - Size index (default: 0)
   * @returns Promise that resolves when sheet is presented
   * @throws Error if sheet not found or presentation fails
   */
  public static async present(name: string, index: number = 0): Promise<void> {
    return TrueSheetModule.present(name, index)
  }

  /**
   * Dismiss the sheet by given name (Promise-based)
   * @param name - Sheet name
   * @returns Promise that resolves when sheet is dismissed
   * @throws Error if sheet not found or dismissal fails
   */
  public static async dismiss(name: string): Promise<void> {
    return TrueSheetModule.dismiss(name)
  }

  /**
   * Resize the sheet by given name (Promise-based)
   * @param name - Sheet name
   * @param index - New size index
   * @returns Promise that resolves when resize is complete
   * @throws Error if sheet not found
   */
  public static async resize(name: string, index: number): Promise<void> {
    return TrueSheetModule.resize(name, index)
  }
  
  // ... rest of component ...
  
  render() {
    return (
      <TrueSheetViewNativeComponent
        {...this.props}
        name={this.props.name}  // Pass name to native
        ref={this.ref}
      />
    )
  }
}
```

---

### 8. Update package.json

**Path**: `package.json`

**Update codegenConfig:**

```json
{
  "codegenConfig": {
    "name": "TrueSheetSpec",
    "type": "all",
    "jsSrcsDir": "src",
    "android": {
      "javaPackageName": "com.lodev09.truesheet"
    },
    "ios": {}
  }
}
```

---

### 9. Update podspec

**Path**: `TrueSheet.podspec`

**Add new source files:**

```ruby
s.source_files = "ios/**/*.{h,m,mm}"

# Make sure Codegen can find specs
s.dependency "React-Codegen"
s.dependency "ReactCommon/turbomodule/core"
```

---

## 🔨 Build Steps

### 1. Install pods
```bash
cd example/ios
pod install
```

### 2. Clean and rebuild
```bash
cd example
yarn ios --mode Debug
```

### 3. Verify Codegen generated files
```bash
find example/ios/build/generated -name "*TrueSheetModule*"
```

---

## ✅ Testing Checklist

### Basic Functionality
- [ ] Present sheet with await - promise resolves
- [ ] Dismiss sheet with await - promise resolves
- [ ] Resize sheet with await - promise resolves
- [ ] Error when sheet name not found
- [ ] Multiple sheets with different names work
- [ ] Events still fire correctly

### Error Handling
- [ ] Try/catch works for present
- [ ] Try/catch works for dismiss
- [ ] Error codes are correct (SHEET_NOT_FOUND, PRESENT_FAILED, etc.)
- [ ] Error messages are helpful

### Edge Cases
- [ ] Present already presented sheet (should resize)
- [ ] Dismiss already dismissed sheet (should succeed)
- [ ] Concurrent operations on same sheet
- [ ] Multiple sheets presenting/dismissing simultaneously
- [ ] Sheet name changes during lifecycle

### Memory
- [ ] No memory leaks after many present/dismiss cycles
- [ ] Sheets properly unregister on unmount
- [ ] No retain cycles

---

## 📖 Usage Examples

### Basic Usage
```typescript
import { TrueSheet } from '@lodev09/react-native-true-sheet'

// Define sheet with name
<TrueSheet name="mySheet" sizes={['auto', 'large']}>
  <View>
    <Text>Content</Text>
  </View>
</TrueSheet>

// Present with await (REAL promise!)
try {
  await TrueSheet.present('mySheet', 0)
  console.log('Sheet successfully presented')
} catch (error) {
  console.error('Failed to present:', error)
}

// Dismiss with await
try {
  await TrueSheet.dismiss('mySheet')
  console.log('Sheet successfully dismissed')
} catch (error) {
  console.error('Failed to dismiss:', error)
}
```

### Sequential Operations
```typescript
async function showSheetSequence() {
  try {
    // Present at small size
    await TrueSheet.present('mySheet', 0)
    await delay(1000)
    
    // Resize to large
    await TrueSheet.resize('mySheet', 1)
    await delay(1000)
    
    // Dismiss
    await TrueSheet.dismiss('mySheet')
    
    console.log('Sequence complete!')
  } catch (error) {
    console.error('Sequence failed:', error)
  }
}
```

### Error Handling
```typescript
try {
  await TrueSheet.present('wrongName', 0)
} catch (error) {
  if (error.code === 'SHEET_NOT_FOUND') {
    console.error('Sheet does not exist!')
  }
}
```

---

## 🎯 Summary

**What you get:**
- ✅ Real promise support (not fake async)
- ✅ Proper error handling with try/catch
- ✅ Error codes: SHEET_NOT_FOUND, PRESENT_FAILED, DISMISS_FAILED
- ✅ Zero breaking changes
- ✅ Architecturally correct Fabric + TurboModule
- ✅ Events still work as before

**Estimated time:** 6-8 hours for full implementation

---

*Guide created: November 15, 2024*  
*Ready for implementation*