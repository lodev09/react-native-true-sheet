//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface LayoutUtil : NSObject

/**
 * Pins a view to its parent view using Auto Layout constraints
 * @param view The view to pin
 * @param parentView The parent view to pin to
 * @param edges The edges to pin (UIRectEdge flags)
 */
+ (void)pinView:(UIView *)view toParentView:(UIView *)parentView edges:(UIRectEdge)edges;

/**
 * Pins a view to its parent view with a specific height constraint
 * @param view The view to pin
 * @param parentView The parent view to pin to
 * @param edges The edges to pin (UIRectEdge flags)
 * @param height The height constraint to apply (0 means no height constraint)
 */
+ (void)pinView:(UIView *)view toParentView:(UIView *)parentView edges:(UIRectEdge)edges height:(CGFloat)height;

/**
 * Pins a view to its parent view with its top edge anchored below a top sibling view
 * @param view The view to pin
 * @param parentView The parent view to pin to
 * @param topView The view to position below (top sibling)
 * @param edges The edges to pin to parent (excluding top, which is pinned to topView)
 */
+ (void)pinView:(UIView *)view toParentView:(UIView *)parentView withTopView:(UIView *)topView edges:(UIRectEdge)edges;

/**
 * Unpins a view by removing its constraints and re-enabling autoresizing mask translation
 * @param view The view to unpin
 */
+ (void)unpinView:(UIView *)view;

@end

NS_ASSUME_NONNULL_END

#endif