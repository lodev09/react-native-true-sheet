//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "TrueSheetBlurView.h"
#import "BlurUtil.h"

#import <react/renderer/components/TrueSheetSpec/Props.h>

using namespace facebook::react;

@implementation TrueSheetBlurView {
  UIViewPropertyAnimator *_blurAnimator;
}

#pragma mark - Initialization

- (instancetype)init {
  if (self = [super init]) {
    _blurInteraction = YES;
  }
  return self;
}

#pragma mark - Public

- (void)addToView:(UIView *)parentView {
  if (self.superview == parentView) {
    return;
  }

  self.frame = parentView.bounds;
  self.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  [parentView insertSubview:self atIndex:0];
}

- (void)clearAnimator {
  if (_blurAnimator) {
    [_blurAnimator stopAnimation:YES];
    _blurAnimator = nil;
  }
}

- (void)applyBlurEffect {
  self.userInteractionEnabled = self.blurInteraction;

  if (self.backgroundBlur == (NSInteger)TrueSheetViewBackgroundBlur::None) {
    [self clearAnimator];
    self.effect = nil;
    return;
  }

  UIBlurEffectStyle style = [BlurUtil blurEffectStyleFromEnum:self.backgroundBlur];
  UIBlurEffect *blurEffect = [UIBlurEffect effectWithStyle:style];

  CGFloat intensity =
    (self.blurIntensity && [self.blurIntensity floatValue] >= 0) ? [self.blurIntensity floatValue] / 100.0 : 1.0;

  if (intensity >= 1.0) {
    [self clearAnimator];
    self.effect = blurEffect;
    return;
  }

  if (!_blurAnimator) {
    __weak __typeof(self) weakSelf = self;
    _blurAnimator = [[UIViewPropertyAnimator alloc] initWithDuration:1.0
                                                               curve:UIViewAnimationCurveLinear
                                                          animations:^{
                                                            weakSelf.effect = blurEffect;
                                                          }];
  }

  _blurAnimator.pausesOnCompletion = YES;
  _blurAnimator.fractionComplete = intensity;
}

@end
