//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(SheetifyViewManager, RCTViewManager)

// Module Functions

/// Presents the sheet controller
RCT_EXTERN_METHOD(present:(nonnull NSNumber*)tag resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

/// Render the ScrollView to be handled properly
RCT_EXTERN_METHOD(handleScrollable: (nonnull NSNumber*)tag scrollableTag:(nonnull NSNumber*)scrollTag)

// Properties
RCT_EXPORT_VIEW_PROPERTY(sizes, NSArray)
RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)

@end
