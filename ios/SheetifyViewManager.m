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

/// Set the scrollable tag to be handled
RCT_EXTERN_METHOD(handleScrollable: (nonnull NSNumber*)tag scrollTag:(nonnull NSNumber*)scrollTag)

RCT_EXTERN_METHOD(handleHeader: (nonnull NSNumber*)tag headerTag:(nonnull NSNumber*)headerTag)
RCT_EXTERN_METHOD(handleFooter: (nonnull NSNumber*)tag footerTag:(nonnull NSNumber*)footerTag)

// Properties
RCT_EXPORT_VIEW_PROPERTY(sizes, NSArray)
RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)

@end
