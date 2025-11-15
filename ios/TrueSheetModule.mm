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

#import <React/RCTSurfacePresenterStub.h>
#import <React/RCTMountingManager.h>

@implementation TrueSheetModule {
    __weak RCTSurfacePresenterStub *_surfacePresenter;
}

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (void)setBridge:(RCTBridge *)bridge {
    [super setBridge:bridge];
    _surfacePresenter = [bridge surfacePresenter];
}

- (void)setSurfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter {
    _surfacePresenter = (RCTSurfacePresenterStub *)surfacePresenter;
}

RCT_EXPORT_METHOD(present:(double)viewTag
                  index:(double)index
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    NSInteger tag = (NSInteger)viewTag;
    NSInteger sizeIndex = (NSInteger)index;
    
    dispatch_async(dispatch_get_main_queue(), ^{
        UIView<RCTComponentViewProtocol> *componentView = [self->_surfacePresenter.mountingManager.componentViewRegistry findComponentViewWithTag:tag];
        
        if ([componentView isKindOfClass:[TrueSheetViewComponentView class]]) {
            TrueSheetViewComponentView *sheetView = (TrueSheetViewComponentView *)componentView;
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
        UIView<RCTComponentViewProtocol> *componentView = [self->_surfacePresenter.mountingManager.componentViewRegistry findComponentViewWithTag:tag];
        
        if ([componentView isKindOfClass:[TrueSheetViewComponentView class]]) {
            TrueSheetViewComponentView *sheetView = (TrueSheetViewComponentView *)componentView;
            [sheetView dismissWithResolve:resolve reject:reject];
        } else {
            NSString *errorMessage = [NSString stringWithFormat:@"Invalid view type for tag %ld. Expected TrueSheetViewComponentView.", (long)tag];
            reject(@"InvalidViewType", errorMessage, nil);
        }
    });
}

@end

#endif // RCT_NEW_ARCH_ENABLED