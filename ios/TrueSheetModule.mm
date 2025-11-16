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
#import "TrueSheetView.h"
#import <React/RCTUtils.h>

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
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
    
    RCTExecuteOnMainQueue(^{
        TrueSheetView *sheet = [TrueSheetModule getSheetByTag:@((NSInteger)viewTag)];
        
        if (!sheet) {
            reject(@"SHEET_NOT_FOUND",
                   [NSString stringWithFormat:@"No sheet found with tag %d", (int)viewTag],
                   nil);
            return;
        }
        
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

- (void)dismissByRef:(double)viewTag
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
    
    RCTExecuteOnMainQueue(^{
        TrueSheetView *sheet = [TrueSheetModule getSheetByTag:@((NSInteger)viewTag)];
        
        if (!sheet) {
            reject(@"SHEET_NOT_FOUND",
                   [NSString stringWithFormat:@"No sheet found with tag %d", (int)viewTag],
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

- (void)resizeByRef:(double)viewTag
              index:(double)index
            resolve:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject {
    // Resize is just present with a different index
    [self presentByRef:viewTag index:index resolve:resolve reject:reject];
}

#pragma mark - Helper Methods

+ (nullable TrueSheetView *)getSheetByTag:(NSNumber *)reactTag {
    if (!reactTag) {
        return nil;
    }
    
    @synchronized (viewRegistry) {
        return viewRegistry[reactTag];
    }
}

+ (void)registerView:(TrueSheetView *)view withTag:(NSNumber *)tag {
    if (!tag || !view) {
        return;
    }
    
    @synchronized (viewRegistry) {
        viewRegistry[tag] = view;
    }
}

+ (void)unregisterViewWithTag:(NSNumber *)tag {
    if (!tag) {
        return;
    }
    
    @synchronized (viewRegistry) {
        [viewRegistry removeObjectForKey:tag];
    }
}



@end

#endif // RCT_NEW_ARCH_ENABLED