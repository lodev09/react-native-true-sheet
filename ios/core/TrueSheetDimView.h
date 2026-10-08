//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Dim behind the sheet for a custom color or opacity, which
 * UISheetPresentationController has no API for. Starts hidden.
 */
@interface TrueSheetDimView : UIView

/// Called when the dim is tapped
@property (nonatomic, copy, nullable) void (^onTap)(void);

/// Adds the dim view behind everything in the presentation container
- (void)addToView:(UIView *)parentView;

/// Fades to the given alpha, alongside the transition if there is one
- (void)fadeToAlpha:(CGFloat)alpha coordinator:(nullable id<UIViewControllerTransitionCoordinator>)coordinator;

@end

NS_ASSUME_NONNULL_END
