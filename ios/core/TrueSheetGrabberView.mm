//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "TrueSheetGrabberView.h"

static const CGFloat kDefaultGrabberWidth = 36.0;
static const CGFloat kDefaultGrabberHeight = 5.0;
static const CGFloat kDefaultGrabberTopMargin = 5.0;

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

#pragma mark - Setup

- (void)setupView {
  self.userInteractionEnabled = NO;
  self.clipsToBounds = YES;

  // Create blur effect for vibrancy base
  UIBlurEffect *blurEffect = [UIBlurEffect effectWithStyle:UIBlurEffectStyleSystemChromeMaterial];
  UIVibrancyEffect *vibrancyEffect = [UIVibrancyEffect effectForBlurEffect:blurEffect
                                                                     style:UIVibrancyEffectStyleFill];

  // Create the vibrancy view that fills this view
  _vibrancyView = [[UIVisualEffectView alloc] initWithEffect:vibrancyEffect];
  _vibrancyView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  [self addSubview:_vibrancyView];

  // Add a fill view inside vibrancy contentView
  _fillView = [[UIView alloc] init];
  _fillView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  _fillView.backgroundColor = [UIColor.darkGrayColor colorWithAlphaComponent:0.4];
  [_vibrancyView.contentView addSubview:_fillView];
}

#pragma mark - Public

- (void)addToView:(UIView *)parentView {
  if (self.superview == parentView) {
    return;
  }

  [parentView addSubview:self];
  [self applyConfiguration];
}

- (void)applyConfiguration {
  CGFloat width = [self effectiveWidth];
  CGFloat height = [self effectiveHeight];
  CGFloat topMargin = [self effectiveTopMargin];
  CGFloat parentWidth = self.superview ? self.superview.bounds.size.width : UIScreen.mainScreen.bounds.size.width;

  // Position the grabber: centered horizontally, with top margin
  self.frame = CGRectMake((parentWidth - width) / 2.0, topMargin, width, height);
  self.layer.cornerRadius = height / 2.0;

  // Update vibrancy and fill view frames
  _vibrancyView.frame = self.bounds;
  _fillView.frame = _vibrancyView.contentView.bounds;

  // Apply custom color to fill view while keeping vibrancy effect
  _fillView.backgroundColor = _color ?: [UIColor.darkGrayColor colorWithAlphaComponent:0.7];
}

- (void)layoutSubviews {
  [super layoutSubviews];
  [self applyConfiguration];
}

@end
