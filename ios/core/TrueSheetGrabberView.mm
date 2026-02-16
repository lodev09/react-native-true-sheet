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

- (CGFloat)effectiveCornerRadius {
  return _cornerRadius ? [_cornerRadius floatValue] : [self effectiveHeight] / 2.0;
}

- (BOOL)isAdaptive {
  return _adaptive ? [_adaptive boolValue] : YES;
}

#pragma mark - Setup

- (void)setupView {
  self.userInteractionEnabled = NO;
  self.clipsToBounds = YES;

  _vibrancyView = [[UIVisualEffectView alloc] initWithEffect:nil];
  _vibrancyView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  [self addSubview:_vibrancyView];

  _fillView = [[UIView alloc] init];
  _fillView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  _fillView.backgroundColor = [UIColor.darkGrayColor colorWithAlphaComponent:0.7];
  [_vibrancyView.contentView addSubview:_fillView];
}

#pragma mark - Public

- (void)addToView:(UIView *)parentView {
  if (self.superview == parentView) {
    return;
  }

  self.autoresizingMask = UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleRightMargin;
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
  self.layer.cornerRadius = [self effectiveCornerRadius];

  // Update vibrancy and fill view frames
  _vibrancyView.frame = self.bounds;
  _fillView.frame = _vibrancyView.contentView.bounds;

  if (self.isAdaptive) {
    _vibrancyView.effect =
      [UIVibrancyEffect effectForBlurEffect:[UIBlurEffect effectWithStyle:UIBlurEffectStyleSystemChromeMaterial]
                                      style:UIVibrancyEffectStyleFill];
    _vibrancyView.backgroundColor = _color;
    _fillView.hidden = NO;
  } else {
    _vibrancyView.effect = nil;
    _vibrancyView.backgroundColor = nil;
    _fillView.hidden = YES;
    self.backgroundColor = _color ?: [UIColor.darkGrayColor colorWithAlphaComponent:0.7];
  }
}

- (void)layoutSubviews {
  [super layoutSubviews];
  [self applyConfiguration];
}

@end
