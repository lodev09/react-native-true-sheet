//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import <React/RCTViewManager.h>

@interface RCT_EXTERN_REMAP_MODULE (TrueSheetView, TrueSheetViewManager, RCTViewManager)

// Module Functions

/// Presents the sheet controller
RCT_EXTERN_METHOD(present:(nonnull NSNumber*)tag
                  index:(int)index
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(dismiss:(nonnull NSNumber*)tag
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

// Events
RCT_EXPORT_VIEW_PROPERTY(onMount, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPresent, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onDismiss, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onSizeChange, RCTDirectEventBlock)

// Properties
RCT_EXPORT_VIEW_PROPERTY(scrollableHandle, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(maxHeight, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(sizes, NSArray)
RCT_EXPORT_VIEW_PROPERTY(blurTint, NSString)
RCT_EXPORT_VIEW_PROPERTY(cornerRadius, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(grabber, BOOL)
RCT_EXPORT_VIEW_PROPERTY(dismissible, BOOL)
RCT_EXPORT_VIEW_PROPERTY(dimmed, BOOL)
RCT_EXPORT_VIEW_PROPERTY(dimmedIndex, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(initialIndex, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(initialIndexAnimated, BOOL)

RCT_EXPORT_VIEW_PROPERTY(anchorViewTag, NSNumber)

// Internal properties
RCT_EXPORT_VIEW_PROPERTY(contentHeight, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(footerHeight, NSNumber)

@end
