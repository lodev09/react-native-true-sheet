//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "TrueSheetDimView.h"
#import "TrueSheetBlurView.h"

using namespace facebook::react;

@implementation TrueSheetDimView {
  TrueSheetBlurView *_blurView;
  // Paused at `fractionComplete` so the blur radius follows the dim, like a blur intensity.
  UIViewPropertyAnimator *_blurAnimator;
  CGFloat _dimAlpha;
}

#pragma mark - Initialization

- (instancetype)init {
  if (self = [super init]) {
    self.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    self.alpha = 0;
    _blur = TrueSheetViewBackgroundBlur::None;
    _blurIntensity = 1;

    UITapGestureRecognizer *tap = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleTap)];
    [self addGestureRecognizer:tap];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(rebuildBlur)
                                                 name:UIApplicationDidBecomeActiveNotification
                                               object:nil];
  }
  return self;
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];

  [_blurAnimator stopAnimation:YES];
}

#pragma mark - Public

- (void)addToView:(UIView *)parentView {
  self.frame = parentView.bounds;
  [parentView insertSubview:self atIndex:0];
}

// Crossfades a blur out at its current strength.
- (void)fadeOutWithDuration:(NSTimeInterval)duration {
  _dimAlpha = 0;
  [UIView animateWithDuration:duration
                   animations:^{
                     [super setAlpha:0];
                   }];
}

- (void)setBlur:(TrueSheetViewBackgroundBlur)blur {
  if (_blur == blur) {
    return;
  }

  _blur = blur;
  [self rebuildBlur];
}

- (void)setBlurIntensity:(CGFloat)blurIntensity {
  _blurIntensity = fmax(0, fmin(1, blurIntensity));
  [self applyBlurProgress];
}

- (void)setAlpha:(CGFloat)alpha {
  _dimAlpha = alpha;

  if (_blurAnimator) {
    [super setAlpha:1];
    [self applyBlurProgress];
  } else {
    [super setAlpha:alpha];
  }
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event {
  if (_dimAlpha <= 0.01) {
    return nil;
  }
  return [super hitTest:point withEvent:event];
}

#pragma mark - Blur

- (void)rebuildBlur {
  [self teardownBlur];

  if (_blur == TrueSheetViewBackgroundBlur::None) {
    [super setAlpha:_dimAlpha];
    return;
  }

  _blurView = [[TrueSheetBlurView alloc] init];
  _blurView.backgroundBlur = _blur;
  [_blurView addToView:self];

  __weak TrueSheetBlurView *blurView = _blurView;
  _blurAnimator = [[UIViewPropertyAnimator alloc] initWithDuration:1
                                                             curve:UIViewAnimationCurveLinear
                                                        animations:^{
                                                          [blurView applyBlurEffect];
                                                        }];
  _blurAnimator.pausesOnCompletion = YES;

  [super setAlpha:1];
  [self applyBlurProgress];
}

- (void)teardownBlur {
  [_blurAnimator stopAnimation:YES];
  _blurAnimator = nil;
  [_blurView removeFromSuperview];
  _blurView = nil;
}

- (void)applyBlurProgress {
  if (!_blurAnimator) {
    return;
  }

  _blurAnimator.fractionComplete = fmax(0, fmin(1, _dimAlpha)) * _blurIntensity;
}

#pragma mark - Actions

- (void)handleTap {
  if (_onTap) {
    _onTap();
  }
}

@end
