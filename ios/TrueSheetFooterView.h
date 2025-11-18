//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import <React/RCTSurfaceTouchHandler.h>
#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

@class TrueSheetViewController;

NS_ASSUME_NONNULL_BEGIN

@interface TrueSheetFooterView : RCTViewComponentView

/**
 * Sets up the footer view with touch handling and constraints
 * @param controller The TrueSheetViewController that owns the view
 */
- (void)setupWithController:(TrueSheetViewController *)controller;

/**
 * Cleans up the footer view before removal
 */
- (void)cleanup;

@end

NS_ASSUME_NONNULL_END

#endif