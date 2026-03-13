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
#import "utils/UIView+ScrollEdgeInteraction.h"

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

    self.backgroundColor = [UIColor clearColor];

    _lastHeight = 0;
    _didInitialLayout = NO;
    _bottomConstraint = nil;
    _currentKeyboardOffset = 0;
  }
  return self;
}

#pragma mark - Layout

- (void)setupConstraintsWithHeight:(CGFloat)height {
  UIView *parentView = self.superview;
  if (!parentView) {
    return;
  }

  [LayoutUtil unpinView:self fromParentView:parentView];
  _bottomConstraint = nil;

  self.translatesAutoresizingMaskIntoConstraints = NO;

  [self.leadingAnchor constraintEqualToAnchor:parentView.leadingAnchor].active = YES;
  [self.trailingAnchor constraintEqualToAnchor:parentView.trailingAnchor].active = YES;

  _bottomConstraint = [self.bottomAnchor constraintEqualToAnchor:parentView.bottomAnchor
                                                        constant:-_currentKeyboardOffset];
  _bottomConstraint.active = YES;

  if (height > 0) {
    [self.heightAnchor constraintEqualToConstant:height].active = YES;
  }

  _lastHeight = height;
}

- (void)didMoveToSuperview {
  [super didMoveToSuperview];

  if (self.superview) {
    CGFloat initialHeight = self.frame.size.height;
    [self setupConstraintsWithHeight:initialHeight];
  }
}

- (void)updateLayoutMetrics:(const facebook::react::LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const facebook::react::LayoutMetrics &)oldLayoutMetrics {
  CGFloat height = layoutMetrics.frame.size.height;

  if (!_didInitialLayout) {
    [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];
    _didInitialLayout = YES;
  }

  if (height != _lastHeight) {
    [self setupConstraintsWithHeight:height];
    [self.delegate footerViewDidChangeSize:CGSizeMake(layoutMetrics.frame.size.width, height)];
  }
}

- (void)prepareForRecycle {
  [super prepareForRecycle];

  [LayoutUtil unpinView:self fromParentView:self.superview];
  if (@available(iOS 26.0, *)) {
    [self cleanupEdgeInteraction];
  }

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
