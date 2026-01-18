//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "TrueSheetFooterView.h"
#import <react/renderer/components/TrueSheetSpec/ComponentDescriptors.h>
#import <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>
#import <react/renderer/components/TrueSheetSpec/RCTComponentViewHelpers.h>
#import "TrueSheetViewController.h"
#import "utils/LayoutUtil.h"

using namespace facebook::react;

@implementation TrueSheetFooterView {
  CGFloat _lastHeight;
  BOOL _didInitialLayout;
  NSLayoutConstraint *_bottomConstraint;
  CGFloat _currentKeyboardOffset;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<TrueSheetFooterViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const TrueSheetFooterViewProps>();
    _props = defaultProps;

    // Set background color to clear by default
    self.backgroundColor = [UIColor clearColor];

    _lastHeight = 0;
    _didInitialLayout = NO;
    _bottomConstraint = nil;
    _currentKeyboardOffset = 0;
  }
  return self;
}

- (void)setupConstraintsWithHeight:(CGFloat)height {
  UIView *parentView = self.superview;
  if (!parentView) {
    return;
  }

  // Remove existing constraints before applying new ones
  [LayoutUtil unpinView:self fromParentView:parentView];
  _bottomConstraint = nil;

  self.translatesAutoresizingMaskIntoConstraints = NO;

  // Pin footer to sides of container
  [self.leadingAnchor constraintEqualToAnchor:parentView.leadingAnchor].active = YES;
  [self.trailingAnchor constraintEqualToAnchor:parentView.trailingAnchor].active = YES;

  // Store bottom constraint for keyboard adjustment, preserving current keyboard offset
  _bottomConstraint = [self.bottomAnchor constraintEqualToAnchor:parentView.bottomAnchor
                                                        constant:-_currentKeyboardOffset];
  _bottomConstraint.active = YES;

  // Apply height constraint
  if (height > 0) {
    [self.heightAnchor constraintEqualToConstant:height].active = YES;
  }

  _lastHeight = height;
}

- (void)didMoveToSuperview {
  [super didMoveToSuperview];

  // Setup footer constraints when added to container
  if (self.superview) {
    CGFloat initialHeight = self.frame.size.height;
    [self setupConstraintsWithHeight:initialHeight];
  }
}

- (void)updateLayoutMetrics:(const facebook::react::LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const facebook::react::LayoutMetrics &)oldLayoutMetrics {
  CGFloat height = layoutMetrics.frame.size.height;

  // On initial layout, call super to let React Native position the view
  // After that, we use Auto Layout constraints instead
  if (!_didInitialLayout) {
    [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];
    _didInitialLayout = YES;
  }

  // Update footer constraints when height changes
  if (height != _lastHeight) {
    [self setupConstraintsWithHeight:height];
  }
}

- (void)prepareForRecycle {
  [super prepareForRecycle];

  // Remove footer constraints
  [LayoutUtil unpinView:self fromParentView:self.superview];

  _lastHeight = 0;
  _didInitialLayout = NO;
  _bottomConstraint = nil;
  _currentKeyboardOffset = 0;
}

#pragma mark - TrueSheetKeyboardObserverDelegate

- (void)keyboardWillShow:(CGFloat)height duration:(NSTimeInterval)duration curve:(UIViewAnimationOptions)curve {
  if (!_bottomConstraint) {
    return;
  }

  _currentKeyboardOffset = height;

  [UIView animateWithDuration:duration
                        delay:0
                      options:curve | UIViewAnimationOptionBeginFromCurrentState
                   animations:^{
                     self->_bottomConstraint.constant = -height;
                     [self.superview layoutIfNeeded];
                   }
                   completion:nil];
}

- (void)keyboardWillHide:(NSTimeInterval)duration curve:(UIViewAnimationOptions)curve {
  if (!_bottomConstraint) {
    return;
  }

  _currentKeyboardOffset = 0;

  [UIView animateWithDuration:duration
                        delay:0
                      options:curve | UIViewAnimationOptionBeginFromCurrentState
                   animations:^{
                     self->_bottomConstraint.constant = 0;
                     [self.superview layoutIfNeeded];
                   }
                   completion:nil];
}

@end

Class<RCTComponentViewProtocol> TrueSheetFooterViewCls(void) {
  return TrueSheetFooterView.class;
}

#endif
