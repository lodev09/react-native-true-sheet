//
//  TrueSheetModule.h
//  TrueSheet
//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#pragma once

#ifdef RCT_NEW_ARCH_ENABLED

#import <React/RCTBridgeModule.h>

NS_ASSUME_NONNULL_BEGIN

@class TrueSheetView;

/**
* TurboModule for TrueSheet imperative API
* Provides promise-based async operations using view references
*/
@interface TrueSheetModule : NSObject <RCTBridgeModule>

/**
* Get a sheet component view by its React tag
* @param reactTag - The React native tag of the view
* @return The TrueSheetView instance, or nil if not found
*/
+ (nullable TrueSheetView *)getSheetByTag:(NSNumber *)reactTag;

/**
* Register a sheet component view with its React tag
* Called automatically by TrueSheetView during initialization
*/
+ (void)registerView:(TrueSheetView *)view withTag:(NSNumber *)tag;

/**
* Unregister a sheet component view
* Called automatically by TrueSheetView during dealloc
*/
+ (void)unregisterViewWithTag:(NSNumber *)tag;

@end

NS_ASSUME_NONNULL_END

#endif // RCT_NEW_ARCH_ENABLED