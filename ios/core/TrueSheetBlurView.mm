//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "TrueSheetBlurView.h"

@implementation TrueSheetBlurView {
  UIViewPropertyAnimator *_blurAnimator;
}

#pragma mark - Private

+ (UIBlurEffectStyle)blurEffectStyleFromString:(NSString *)tintString {
  static NSDictionary<NSString *, NSNumber *> *styleMap = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    styleMap = @{
      @"dark" : @(UIBlurEffectStyleDark),
      @"light" : @(UIBlurEffectStyleLight),
      @"extra-light" : @(UIBlurEffectStyleExtraLight),
      @"regular" : @(UIBlurEffectStyleRegular),
      @"prominent" : @(UIBlurEffectStyleProminent),
      @"system-ultra-thin-material" : @(UIBlurEffectStyleSystemUltraThinMaterial),
      @"system-thin-material" : @(UIBlurEffectStyleSystemThinMaterial),
      @"system-material" : @(UIBlurEffectStyleSystemMaterial),
      @"system-thick-material" : @(UIBlurEffectStyleSystemThickMaterial),
      @"system-chrome-material" : @(UIBlurEffectStyleSystemChromeMaterial),
      @"system-ultra-thin-material-light" : @(UIBlurEffectStyleSystemUltraThinMaterialLight),
      @"system-thin-material-light" : @(UIBlurEffectStyleSystemThinMaterialLight),
      @"system-material-light" : @(UIBlurEffectStyleSystemMaterialLight),
      @"system-thick-material-light" : @(UIBlurEffectStyleSystemThickMaterialLight),
      @"system-chrome-material-light" : @(UIBlurEffectStyleSystemChromeMaterialLight),
      @"system-ultra-thin-material-dark" : @(UIBlurEffectStyleSystemUltraThinMaterialDark),
      @"system-thin-material-dark" : @(UIBlurEffectStyleSystemThinMaterialDark),
      @"system-material-dark" : @(UIBlurEffectStyleSystemMaterialDark),
      @"system-thick-material-dark" : @(UIBlurEffectStyleSystemThickMaterialDark),
      @"system-chrome-material-dark" : @(UIBlurEffectStyleSystemChromeMaterialDark),
    };
  });

  NSNumber *style = styleMap[tintString];
  if (style) {
    return (UIBlurEffectStyle)[style integerValue];
  }

  return UIBlurEffectStyleLight;
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

- (void)applyBlurEffect {
  self.userInteractionEnabled = self.blurInteraction;

  // Create animator only once
  if (!_blurAnimator) {
    UIBlurEffectStyle style = [TrueSheetBlurView blurEffectStyleFromString:self.blurTint];
    UIBlurEffect *blurEffect = [UIBlurEffect effectWithStyle:style];

    __weak __typeof(self) weakSelf = self;
    _blurAnimator = [[UIViewPropertyAnimator alloc] initWithDuration:1.0
                                                               curve:UIViewAnimationCurveLinear
                                                          animations:^{
                                                            weakSelf.effect = blurEffect;
                                                          }];
    _blurAnimator.pausesOnCompletion = YES;
  }

  // Update intensity
  CGFloat intensity =
    (self.blurIntensity && [self.blurIntensity floatValue] >= 0) ? [self.blurIntensity floatValue] / 100.0 : 1.0;
  _blurAnimator.fractionComplete = intensity;
}

- (void)willMoveToSuperview:(UIView *)newSuperview {
  [super willMoveToSuperview:newSuperview];

  // Clean up when removed from superview
  if (!newSuperview) {
    if (_blurAnimator) {
      [_blurAnimator stopAnimation:YES];
      _blurAnimator = nil;
    }

    self.effect = nil;
  }
}

@end
