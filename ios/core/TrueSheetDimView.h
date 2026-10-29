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
 * Dim behind the sheet for a custom color, opacity, or blur, which
 * UISheetPresentationController has no API for. Starts hidden.
 */
@interface TrueSheetDimView : UIView

/// Called when the dim is tapped
@property (nonatomic, copy, nullable) void (^onTap)(void);

/// `UIBlurEffectStyle` shown instead of the background color. `nil` dims with the color.
@property (nonatomic, strong, nullable) NSNumber *blurStyle;

/// Blur strength at full dim, from 0 to 1. `alpha` scales it while the sheet moves.
@property (nonatomic, assign) CGFloat blurIntensity;

/// Adds the dim view behind everything in the presentation container
- (void)addToView:(UIView *)parentView;

@end

NS_ASSUME_NONNULL_END
