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

// Static registry to store view references by tag
static NSMutableDictionary<NSNumber *, TrueSheetView *> *viewRegistry;

@interface TrueSheetModule () <NativeTrueSheetModuleSpec>
@end

@implementation TrueSheetModule

RCT_EXPORT_MODULE(TrueSheetModule)

+ (void)initialize {
  if (self == [TrueSheetModule class]) {
    viewRegistry = [NSMutableDictionary new];
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

- (void)dismissAll:(BOOL)animated
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
  RCTExecuteOnMainQueue(^{
    @synchronized(viewRegistry) {
      // Find the root presented sheet (one without a parent TrueSheet)
      TrueSheetView *rootSheet = nil;

      for (TrueSheetView *view in viewRegistry.allValues) {
        if (!view.viewController.isPresented) {
          continue;
        }

        UIViewController *presenter = view.viewController.presentingViewController;
        BOOL hasParentSheet = [presenter isKindOfClass:[TrueSheetViewController class]];

        if (!hasParentSheet) {
          rootSheet = view;
          break;
        }
      }

      if (!rootSheet) {
        resolve(nil);
        return;
      }

      [rootSheet dismissAllAnimated:animated
                         completion:^(BOOL success, NSError *_Nullable error) {
                           if (success) {
                             resolve(nil);
                           } else {
                             reject(@"DISMISS_FAILED", error.localizedDescription ?: @"Failed to dismiss sheets",
                                    error);
                           }
                         }];
    }
  });
}

#pragma mark - Helper Methods

+ (nullable TrueSheetView *)getTrueSheetViewByTag:(NSNumber *)reactTag {
  if (!reactTag) {
    return nil;
  }

  @synchronized(viewRegistry) {
    return viewRegistry[reactTag];
  }
}

+ (void)registerView:(TrueSheetView *)view withTag:(NSNumber *)tag {
  if (!tag || !view) {
    return;
  }

  @synchronized(viewRegistry) {
    viewRegistry[tag] = view;
  }
}

+ (void)unregisterViewWithTag:(NSNumber *)tag {
  if (!tag) {
    return;
  }

  @synchronized(viewRegistry) {
    [viewRegistry removeObjectForKey:tag];
  }
}

@end

#endif  // RCT_NEW_ARCH_ENABLED
