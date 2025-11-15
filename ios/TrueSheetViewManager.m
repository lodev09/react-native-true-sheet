//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "TrueSheetViewManager.h"
#import "TrueSheetView.h"
#import <React/RCTUIManager.h>

@implementation TrueSheetViewManager

RCT_EXPORT_MODULE(TrueSheetView)

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

- (UIView *)view {
    return [[TrueSheetView alloc] initWithBridge:self.bridge];
}

// MARK: - React Functions

RCT_EXPORT_METHOD(present:(nonnull NSNumber *)tag
                  index:(NSInteger)index
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        TrueSheetView *view = (TrueSheetView *)viewRegistry[tag];
        if ([view isKindOfClass:[TrueSheetView class]]) {
            [view presentAtIndex:index resolve:resolve reject:reject];
        } else {
            reject(@"Error", @"Invalid view type", nil);
        }
    }];
}

RCT_EXPORT_METHOD(dismiss:(nonnull NSNumber *)tag
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        TrueSheetView *view = (TrueSheetView *)viewRegistry[tag];
        if ([view isKindOfClass:[TrueSheetView class]]) {
            [view dismissWithResolve:resolve reject:reject];
        } else {
            reject(@"Error", @"Invalid view type", nil);
        }
    }];
}

// Events
RCT_EXPORT_VIEW_PROPERTY(onMount, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPresent, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onDismiss, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onSizeChange, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onDragBegin, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onDragChange, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onDragEnd, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onContainerSizeChange, RCTDirectEventBlock)

// Properties
RCT_EXPORT_VIEW_PROPERTY(scrollableHandle, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(maxHeight, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(sizes, NSArray)
RCT_EXPORT_VIEW_PROPERTY(blurTint, NSString)
RCT_EXPORT_VIEW_PROPERTY(background, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(cornerRadius, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(grabber, BOOL)
RCT_EXPORT_VIEW_PROPERTY(dismissible, BOOL)
RCT_EXPORT_VIEW_PROPERTY(dimmed, BOOL)
RCT_EXPORT_VIEW_PROPERTY(dimmedIndex, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(initialIndex, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(initialIndexAnimated, BOOL)

// Internal properties
RCT_EXPORT_VIEW_PROPERTY(contentHeight, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(footerHeight, NSNumber)

@end