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

- (void)applyBlurEffect {
  if (!self.blurTint || self.blurTint.length == 0) {
    [self removeBlurEffect];
    return;
  }

  // Stop and clear existing animator
  if (_blurAnimator) {
    [_blurAnimator stopAnimation:YES];
    _blurAnimator = nil;
  }

  // Clear existing effect
  self.effect = nil;

  UIBlurEffectStyle style = [TrueSheetBlurView blurEffectStyleFromString:self.blurTint];
  UIBlurEffect *blurEffect = [UIBlurEffect effectWithStyle:style];

  self.userInteractionEnabled = self.blurInteraction;

  // Use animator to control blur intensity
  __weak typeof(self) weakSelf = self;
  _blurAnimator = [[UIViewPropertyAnimator alloc] initWithDuration:1.0 curve:UIViewAnimationCurveLinear animations:^{
    weakSelf.effect = blurEffect;
  }];
  _blurAnimator.pausesOnCompletion = YES;

  // Set intensity: nil means system default (100%), otherwise use provided value (0-100)
  CGFloat intensity = (self.blurIntensity && [self.blurIntensity floatValue] >= 0)
    ? [self.blurIntensity floatValue] / 100.0
    : 1.0;
  _blurAnimator.fractionComplete = intensity;
}

- (void)removeBlurEffect {
  if (_blurAnimator) {
    [_blurAnimator stopAnimation:YES];
    _blurAnimator = nil;
  }

  self.effect = nil;
}

- (void)dealloc {
  [self removeBlurEffect];
}

@end
