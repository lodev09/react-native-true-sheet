//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "TrueSheetGrabberView.h"

static const CGFloat kGrabberWidth = 36.0;
static const CGFloat kGrabberHeight = 5.0;
static const CGFloat kGrabberTopMargin = 5.0;
static const CGFloat kContainerHeight = kGrabberHeight + (kGrabberTopMargin * 2);

@implementation TrueSheetGrabberView {
  UIVisualEffectView *_blurView;
  UIView *_grabberPill;
}

#pragma mark - Initialization

- (instancetype)init {
  if (self = [super init]) {
    [self setupView];
  }
  return self;
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    [self setupView];
  }
  return self;
}

#pragma mark - Setup

- (void)setupView {
  self.userInteractionEnabled = NO;

  // Create the pill container (clips the blur effect like _UIGrabber does)
  _grabberPill = [[UIView alloc] init];
  _grabberPill.translatesAutoresizingMaskIntoConstraints = NO;
  _grabberPill.layer.cornerRadius = kGrabberHeight / 2.0;
  _grabberPill.clipsToBounds = YES;
  [self addSubview:_grabberPill];

  // Create blur effect for vibrancy base
  UIBlurEffect *blurEffect = [UIBlurEffect effectWithStyle:UIBlurEffectStyleSystemChromeMaterial];

  // Create vibrancy effect with tertiary label style (more opaque, greyish)
  UIVibrancyEffect *vibrancyEffect = [UIVibrancyEffect effectForBlurEffect:blurEffect
                                                                     style:UIVibrancyEffectStyleFill];

  // Create the vibrancy view (larger than pill, like native 36x15)
  _blurView = [[UIVisualEffectView alloc] initWithEffect:vibrancyEffect];
  _blurView.translatesAutoresizingMaskIntoConstraints = NO;
  [_grabberPill addSubview:_blurView];

  // Add a fill view inside vibrancy contentView
  UIView *fillView = [[UIView alloc] init];
  fillView.translatesAutoresizingMaskIntoConstraints = NO;
  fillView.backgroundColor = [UIColor.darkGrayColor colorWithAlphaComponent:0.4];
  [_blurView.contentView addSubview:fillView];

  [NSLayoutConstraint activateConstraints:@[
    [fillView.topAnchor constraintEqualToAnchor:_blurView.contentView.topAnchor],
    [fillView.leadingAnchor constraintEqualToAnchor:_blurView.contentView.leadingAnchor],
    [fillView.trailingAnchor constraintEqualToAnchor:_blurView.contentView.trailingAnchor],
    [fillView.bottomAnchor constraintEqualToAnchor:_blurView.contentView.bottomAnchor],
  ]];

  // Setup constraints
  [NSLayoutConstraint activateConstraints:@[
    // Pill container centered
    [_grabberPill.centerXAnchor constraintEqualToAnchor:self.centerXAnchor],
    [_grabberPill.centerYAnchor constraintEqualToAnchor:self.centerYAnchor],
    [_grabberPill.widthAnchor constraintEqualToConstant:kGrabberWidth],
    [_grabberPill.heightAnchor constraintEqualToConstant:kGrabberHeight],

    // Blur view larger and offset (like native 36x15 at {0, -5})
    [_blurView.centerXAnchor constraintEqualToAnchor:_grabberPill.centerXAnchor],
    [_blurView.centerYAnchor constraintEqualToAnchor:_grabberPill.centerYAnchor],
    [_blurView.widthAnchor constraintEqualToConstant:kGrabberWidth],
    [_blurView.heightAnchor constraintEqualToConstant:15.0],
  ]];
}

#pragma mark - Layout

- (CGSize)intrinsicContentSize {
  return CGSizeMake(UIViewNoIntrinsicMetric, kContainerHeight);
}

+ (CGFloat)preferredHeight {
  return kContainerHeight;
}

@end
