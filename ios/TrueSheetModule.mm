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
#import <React/RCTUtils.h>
#import "TrueSheetView.h"
#import "TrueSheetViewController.h"

#import <TrueSheetSpec/TrueSheetSpec.h>

// Static registry of live hosts by tag — weak so an unmounted host deallocates
// (RN zeroes the tag before teardown, so hosts can't unregister themselves)
static NSMapTable<NSNumber *, TrueSheetView *> *viewRegistry;

@interface TrueSheetModule () <NativeTrueSheetModuleSpec>
@end

@implementation TrueSheetModule

RCT_EXPORT_MODULE(TrueSheetModule)

+ (void)initialize {
  if (self == [TrueSheetModule class]) {
    viewRegistry = [NSMapTable strongToWeakObjectsMapTable];
  }
}

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
  (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeTrueSheetModuleSpecJSI>(params);
}

#pragma mark - TurboModule Methods

- (void)presentByRef:(double)viewTag
               index:(double)index
            animated:(BOOL)animated
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
  RCTExecuteOnMainQueue(^{
    TrueSheetView *trueSheetView = [TrueSheetModule getTrueSheetViewByTag:@((NSInteger)viewTag)];

    if (!trueSheetView) {
      reject(@"SHEET_NOT_FOUND", [NSString stringWithFormat:@"No sheet found with tag %d", (int)viewTag], nil);
      return;
    }

    [trueSheetView presentAtIndex:(NSInteger)index
                         animated:animated
                       completion:^(BOOL success, NSError *_Nullable error) {
                         if (success) {
                           resolve(nil);
                         } else {
                           reject(@"PRESENT_FAILED", error.localizedDescription ?: @"Failed to present sheet", error);
                         }
                       }];
  });
}

- (void)dismissByRef:(double)viewTag
            animated:(BOOL)animated
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
  RCTExecuteOnMainQueue(^{
    TrueSheetView *trueSheetView = [TrueSheetModule getTrueSheetViewByTag:@((NSInteger)viewTag)];

    if (!trueSheetView) {
      reject(@"SHEET_NOT_FOUND", [NSString stringWithFormat:@"No sheet found with tag %d", (int)viewTag], nil);
      return;
    }

    [trueSheetView dismissAnimated:animated
                        completion:^(BOOL success, NSError *_Nullable error) {
                          if (success) {
                            resolve(nil);
                          } else {
                            reject(@"DISMISS_FAILED", error.localizedDescription ?: @"Failed to dismiss sheet", error);
                          }
                        }];
  });
}

- (void)dismissStackByRef:(double)viewTag
                 animated:(BOOL)animated
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject {
  RCTExecuteOnMainQueue(^{
    TrueSheetView *trueSheetView = [TrueSheetModule getTrueSheetViewByTag:@((NSInteger)viewTag)];

    if (!trueSheetView) {
      reject(@"SHEET_NOT_FOUND", [NSString stringWithFormat:@"No sheet found with tag %d", (int)viewTag], nil);
      return;
    }

    [trueSheetView
      dismissStackAnimated:animated
                completion:^(BOOL success, NSError *_Nullable error) {
                  if (success) {
                    resolve(nil);
                  } else {
                    reject(@"DISMISS_FAILED", error.localizedDescription ?: @"Failed to dismiss stack", error);
                  }
                }];
  });
}

- (void)resizeByRef:(double)viewTag
              index:(double)index
            resolve:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject {
  RCTExecuteOnMainQueue(^{
    TrueSheetView *trueSheetView = [TrueSheetModule getTrueSheetViewByTag:@((NSInteger)viewTag)];

    if (!trueSheetView) {
      reject(@"SHEET_NOT_FOUND", [NSString stringWithFormat:@"No sheet found with tag %d", (int)viewTag], nil);
      return;
    }

    [trueSheetView resizeToIndex:(NSInteger)index
                      completion:^(BOOL success, NSError *_Nullable error) {
                        if (success) {
                          resolve(nil);
                        } else {
                          reject(@"RESIZE_FAILED", error.localizedDescription ?: @"Failed to resize sheet", error);
                        }
                      }];
  });
}

- (void)handleBackPress:(double)viewTag resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  // No-op on iOS — no hardware back button
  resolve(nil);
}

- (void)dismissAll:(BOOL)animated resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  RCTExecuteOnMainQueue(^{
    @synchronized(viewRegistry) {
      // Drop presents still waiting on another sheet's dismissal
      for (TrueSheetView *view in viewRegistry.objectEnumerator) {
        [view cancelPendingPresent];
      }

      // Sheets hidden by navigation are still open in JS, so close them too. Among the
      // rest, find the root presented sheet (one without a parent TrueSheet).
      NSMutableArray<TrueSheetView *> *sheets = [NSMutableArray array];
      TrueSheetView *rootSheet = nil;

      for (TrueSheetView *view in viewRegistry.objectEnumerator) {
        if (view.isHiddenByNavigation) {
          [sheets addObject:view];
          continue;
        }

        // A sheet still animating in counts too — dismissAnimated waits for it to land
        if (rootSheet || (!view.viewController.isPresented && !view.viewController.isBeingPresented)) {
          continue;
        }

        UIViewController *presenter = view.viewController.presentingViewController;
        if (![presenter isKindOfClass:[TrueSheetViewController class]]) {
          rootSheet = view;
        }
      }

      if (rootSheet) {
        // Mid-present, the deferred dismiss tracks its own position like a regular dismiss
        if (rootSheet.viewController.isPresented) {
          [rootSheet emitDismissedPosition];
        }
        [sheets addObject:rootSheet];
      }

      dispatch_group_t group = dispatch_group_create();
      __block BOOL failed = NO;
      __block NSError *failure = nil;

      for (TrueSheetView *view in sheets) {
        dispatch_group_enter(group);
        [view dismissAnimated:animated
                   completion:^(BOOL success, NSError *_Nullable error) {
                     if (!success) {
                       failed = YES;
                       failure = error;
                     }
                     dispatch_group_leave(group);
                   }];
      }

      dispatch_group_notify(group, dispatch_get_main_queue(), ^{
        if (failed) {
          reject(@"DISMISS_FAILED", failure.localizedDescription ?: @"Failed to dismiss sheets", failure);
        } else {
          resolve(nil);
        }
      });
    }
  });
}

#pragma mark - Helper Methods

+ (nullable TrueSheetView *)getTrueSheetViewByTag:(NSNumber *)reactTag {
  if (!reactTag) {
    return nil;
  }

  @synchronized(viewRegistry) {
    return [viewRegistry objectForKey:reactTag];
  }
}

+ (void)registerView:(TrueSheetView *)view withTag:(NSNumber *)tag {
  if (!tag || !view) {
    return;
  }

  @synchronized(viewRegistry) {
    [viewRegistry setObject:view forKey:tag];
  }
}

@end

#endif  // RCT_NEW_ARCH_ENABLED
