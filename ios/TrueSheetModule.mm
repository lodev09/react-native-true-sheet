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

#import <React/RCTUIManager.h>
#import <React/RCTViewComponentView.h>
#import <React/RCTMountingTransactionObserving.h>

#import "TrueSheetViewSpec.h"

@interface TrueSheetModule () <NativeTrueSheetModuleSpec>
@end

@implementation TrueSheetModule {
    RCTUIManager *_uiManager;
}

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (void)setBridge:(RCTBridge *)bridge {
    [super setBridge:bridge];
    _uiManager = [bridge moduleForClass:[RCTUIManager class]];
}

RCT_EXPORT_METHOD(present:(double)viewTag
                  index:(double)index
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    NSInteger tag = (NSInteger)viewTag;
    NSInteger sizeIndex = (NSInteger)index;
    
    dispatch_async(dispatch_get_main_queue(), ^{
        UIView *view = [self->_uiManager viewForReactTag:@(tag)];
        
        if ([view isKindOfClass:[TrueSheetViewComponentView class]]) {
            TrueSheetViewComponentView *sheetView = (TrueSheetViewComponentView *)view;
            [sheetView presentAtIndex:sizeIndex resolve:resolve reject:reject];
        } else {
            NSString *errorMessage = [NSString stringWithFormat:@"Invalid view type for tag %ld. Expected TrueSheetViewComponentView.", (long)tag];
            reject(@"InvalidViewType", errorMessage, nil);
        }
    });
}

RCT_EXPORT_METHOD(dismiss:(double)viewTag
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    NSInteger tag = (NSInteger)viewTag;
    
    dispatch_async(dispatch_get_main_queue(), ^{
        UIView *view = [self->_uiManager viewForReactTag:@(tag)];
        
        if ([view isKindOfClass:[TrueSheetViewComponentView class]]) {
            TrueSheetViewComponentView *sheetView = (TrueSheetViewComponentView *)view;
            [sheetView dismissWithResolve:resolve reject:reject];
        } else {
            NSString *errorMessage = [NSString stringWithFormat:@"Invalid view type for tag %ld. Expected TrueSheetViewComponentView.", (long)tag];
            reject(@"InvalidViewType", errorMessage, nil);
        }
    });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeTrueSheetModuleSpecJSI>(params);
}

@end

#endif // RCT_NEW_ARCH_ENABLED