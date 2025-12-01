//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface TrueSheetBlurView : UIVisualEffectView

@property (nonatomic, copy, nullable) NSString *blurTint;
@property (nonatomic, strong, nullable) NSNumber *blurIntensity;
@property (nonatomic, assign) BOOL blurInteraction;

/// Adds the blur view to a parent view with proper constraints
- (void)addToView:(UIView *)parentView;

- (void)applyBlurEffect;

@end

NS_ASSUME_NONNULL_END
