//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Hidden host that renders its children in a container attached directly to
 * the window, above every presented sheet.
 */
@interface TrueSheetOverlayView : RCTViewComponentView

/**
 * Re-stacks every overlay container above the window's other subviews.
 * Called when a sheet presents, since presenting adds its transition view on top.
 */
+ (void)bringOverlaysToFrontInWindow:(nullable UIWindow *)window;

@end

NS_ASSUME_NONNULL_END

#endif
