//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import <UIKit/UIKit.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Dim behind the sheet for a custom color, opacity, or blur, which
 * UISheetPresentationController has no API for. Starts hidden.
 */
@interface TrueSheetDimView : UIView

/// Called when the dim is tapped
@property (nonatomic, copy, nullable) void (^onTap)(void);

/// Blur shown instead of the background color. `None` dims with the color.
@property (nonatomic, assign) facebook::react::TrueSheetViewBackgroundBlur blur;

/// Blur strength at full dim, from 0 to 1. `alpha` scales it while the sheet moves.
@property (nonatomic, assign) CGFloat blurIntensity;

/// Adds the dim view behind everything in the presentation container
- (void)addToView:(UIView *)parentView;

/// Fades the dim out. Use instead of animating `alpha`, which sets the blur without animating it.
- (void)fadeOutWithDuration:(NSTimeInterval)duration;

@end

NS_ASSUME_NONNULL_END
