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

@implementation TrueSheetBlurView

#pragma mark - Initialization

- (instancetype)init {
  if (self = [super init]) {
    self.userInteractionEnabled = NO;
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
  if (self.backgroundBlur == TrueSheetViewBackgroundBlur::None) {
    self.effect = nil;
    return;
  }

  UIBlurEffectStyle style = [BlurUtil blurEffectStyleFromEnum:self.backgroundBlur];
  self.effect = [UIBlurEffect effectWithStyle:style];
}

@end
