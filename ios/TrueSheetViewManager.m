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
RCT_EXPORT_VIEW_PROPERTY(onPresent, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onDismiss, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onSizeChange, RCTDirectEventBlock)

// Internal Properties
RCT_EXPORT_VIEW_PROPERTY(scrollableHandle, NSNumber*)
RCT_EXPORT_VIEW_PROPERTY(footerHandle, NSNumber*)

// Properties
RCT_EXPORT_VIEW_PROPERTY(sizes, NSArray)

@end
