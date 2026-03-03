//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "TrueSheetGrabberView.h"

@implementation GrabberOptions

- (instancetype)init {
  if (self = [super init]) {
    _adaptive = YES;
  }
  return self;
}

@end

static const CGFloat kDefaultGrabberWidth = 36.0;
static const CGFloat kDefaultGrabberHeight = 5.0;
static const CGFloat kDefaultGrabberTopMargin = 5.0;
static const CGFloat kHitPaddingHorizontal = 20.0;
static const CGFloat kHitPaddingVertical = 10.0;

@implementation TrueSheetGrabberView {
  UIVisualEffectView *_vibrancyView;
  UIView *_fillView;
}

#pragma mark - Initialization

- (instancetype)init {
  if (self = [super init]) {
    [self setupView];
  }
  return self;
}

#pragma mark - Computed Properties

- (CGFloat)effectiveWidth {
  return _grabberWidth ? [_grabberWidth floatValue] : kDefaultGrabberWidth;
}

- (CGFloat)effectiveHeight {
  return _grabberHeight ? [_grabberHeight floatValue] : kDefaultGrabberHeight;
}

- (CGFloat)effectiveTopMargin {
  return _topMargin ? [_topMargin floatValue] : kDefaultGrabberTopMargin;
}

- (CGFloat)effectiveCornerRadius {
  return _cornerRadius ? [_cornerRadius floatValue] : [self effectiveHeight] / 2.0;
}

- (BOOL)isAdaptive {
  return _adaptive ? [_adaptive boolValue] : YES;
}

#pragma mark - Setup

- (void)setupView {
  self.clipsToBounds = NO;
  self.isAccessibilityElement = YES;
  self.accessibilityLabel = @"Sheet Grabber";
  self.accessibilityTraits = UIAccessibilityTraitAdjustable | UIAccessibilityTraitButton;
  self.accessibilityHint = @"Double-tap to expand. Swipe up or down to resize the sheet";

  UITapGestureRecognizer *tap = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleTap)];
  [self addGestureRecognizer:tap];

  _vibrancyView = [[UIVisualEffectView alloc] initWithEffect:nil];
  [self addSubview:_vibrancyView];

  _fillView = [[UIView alloc] init];
  _fillView.backgroundColor = [UIColor.darkGrayColor colorWithAlphaComponent:0.7];
  [_vibrancyView.contentView addSubview:_fillView];
}

#pragma mark - Actions

- (void)handleTap {
  if (_onTap) {
    _onTap();
  }
}

- (void)accessibilityIncrement {
  if (_onIncrement) {
    _onIncrement();
  }
}

- (void)accessibilityDecrement {
  if (_onDecrement) {
    _onDecrement();
  }
}

#pragma mark - Public

- (void)updateAccessibilityValueWithIndex:(NSInteger)index detentCount:(NSInteger)count {
  if (index < 0 || count <= 0) {
    self.accessibilityValue = nil;
    return;
  }

  if (index >= count - 1) {
    self.accessibilityValue = @"Expanded";
  } else if (index == 0) {
    self.accessibilityValue = @"Collapsed";
  } else {
    self.accessibilityValue = [NSString stringWithFormat:@"Detent %ld of %ld", (long)(index + 1), (long)count];
  }
}

- (void)addToView:(UIView *)parentView {
  if (self.superview == parentView) {
    return;
  }

  self.autoresizingMask = UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleRightMargin;
  [parentView addSubview:self];
  [self applyConfiguration];
}

- (void)applyConfiguration {
  CGFloat pillWidth = [self effectiveWidth];
  CGFloat pillHeight = [self effectiveHeight];
  CGFloat topMargin = [self effectiveTopMargin];
  CGFloat parentWidth = self.superview ? self.superview.bounds.size.width : UIScreen.mainScreen.bounds.size.width;

  CGFloat frameWidth = pillWidth + kHitPaddingHorizontal * 2;
  CGFloat frameHeight = pillHeight + kHitPaddingVertical * 2;
  CGFloat frameY = topMargin - kHitPaddingVertical;

  self.frame = CGRectMake((parentWidth - frameWidth) / 2.0, frameY, frameWidth, frameHeight);
  self.backgroundColor = UIColor.clearColor;

  CGRect pillRect = CGRectMake(kHitPaddingHorizontal, kHitPaddingVertical, pillWidth, pillHeight);
  _vibrancyView.frame = pillRect;
  _vibrancyView.layer.cornerRadius = [self effectiveCornerRadius];
  _vibrancyView.clipsToBounds = YES;
  _fillView.frame = _vibrancyView.contentView.bounds;

  if (self.isAdaptive) {
    _vibrancyView.effect =
      [UIVibrancyEffect effectForBlurEffect:[UIBlurEffect effectWithStyle:UIBlurEffectStyleSystemChromeMaterial]
                                      style:UIVibrancyEffectStyleFill];
    _vibrancyView.backgroundColor = _color;
    _fillView.hidden = NO;
  } else {
    _vibrancyView.effect = nil;
    _fillView.hidden = YES;
    _vibrancyView.backgroundColor = _color ?: [UIColor.darkGrayColor colorWithAlphaComponent:0.7];
  }
}

- (void)layoutSubviews {
  [super layoutSubviews];
  [self applyConfiguration];
}

@end
