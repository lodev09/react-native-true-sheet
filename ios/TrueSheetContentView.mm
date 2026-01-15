//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "TrueSheetContentView.h"
#import <React/RCTScrollViewComponentView.h>
#import <react/renderer/components/TrueSheetSpec/ComponentDescriptors.h>
#import <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>
#import <react/renderer/components/TrueSheetSpec/RCTComponentViewHelpers.h>
#import "TrueSheetView.h"
#import "TrueSheetViewController.h"
#import "utils/LayoutUtil.h"
#import "utils/UIView+FirstResponder.h"

using namespace facebook::react;

@implementation TrueSheetContentView {
  RCTScrollViewComponentView *_pinnedScrollView;
  UIView *_pinnedTopView;
  CGSize _lastSize;
  UIEdgeInsets _contentInsets;
  UIEdgeInsets _pinnedInsets;
  CGFloat _bottomInset;
  CGFloat _originalIndicatorBottomInset;
  CGFloat _currentKeyboardHeight;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<TrueSheetContentViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const TrueSheetContentViewProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - Layout

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics {
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  UIEdgeInsets newInsets = UIEdgeInsetsMake(layoutMetrics.contentInsets.top, layoutMetrics.contentInsets.left,
    layoutMetrics.contentInsets.bottom, layoutMetrics.contentInsets.right);

  if (!UIEdgeInsetsEqualToEdgeInsets(newInsets, _contentInsets)) {
    _contentInsets = newInsets;
    [self.delegate contentViewDidChangeInsets];
  }

  CGSize newSize = CGSizeMake(layoutMetrics.frame.size.width, layoutMetrics.frame.size.height);
  if (!CGSizeEqualToSize(newSize, _lastSize)) {
    _lastSize = newSize;
    [self.delegate contentViewDidChangeSize:newSize];
  }
}

#pragma mark - Child Mounting

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [super mountChildComponentView:childComponentView index:index];
  [self.delegate contentViewDidChangeChildren];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [super unmountChildComponentView:childComponentView index:index];
  [self.delegate contentViewDidChangeChildren];
}

#pragma mark - ScrollView Pinning

- (void)clearPinning {
  if (_pinnedScrollView) {
    [LayoutUtil unpinView:_pinnedScrollView fromParentView:self];
    [LayoutUtil unpinView:_pinnedScrollView fromParentView:self.superview];

    UIEdgeInsets contentInset = _pinnedScrollView.scrollView.contentInset;
    contentInset.bottom = 0;
    _pinnedScrollView.scrollView.contentInset = contentInset;

    UIEdgeInsets indicatorInsets = _pinnedScrollView.scrollView.verticalScrollIndicatorInsets;
    indicatorInsets.bottom = _originalIndicatorBottomInset;
    _pinnedScrollView.scrollView.verticalScrollIndicatorInsets = indicatorInsets;
  }
  _pinnedScrollView = nil;
  _pinnedTopView = nil;
  _pinnedInsets = UIEdgeInsetsZero;
  _bottomInset = 0;
  _originalIndicatorBottomInset = 0;
}

- (void)setupScrollViewPinning:(BOOL)pinned bottomInset:(CGFloat)bottomInset {
  UIView *containerView = self.superview;

  if (!pinned) {
    [self clearPinning];
    return;
  }

  UIView *topSibling = nil;
  RCTScrollViewComponentView *scrollView = [self findScrollView:&topSibling];

  BOOL needsUpdate = scrollView != _pinnedScrollView || topSibling != _pinnedTopView ||
                     !UIEdgeInsetsEqualToEdgeInsets(_contentInsets, _pinnedInsets) ||
                     _bottomInset != bottomInset;

  if (scrollView && containerView && needsUpdate) {
    [self clearPinning];

    UIEdgeInsets insets =
      UIEdgeInsetsMake(topSibling ? 0 : _contentInsets.top, _contentInsets.left, 0, _contentInsets.right);

    if (topSibling) {
      [LayoutUtil pinView:scrollView
             toParentView:self
              withTopView:topSibling
                    edges:UIRectEdgeLeft | UIRectEdgeRight
                   insets:insets];
    } else {
      [LayoutUtil pinView:scrollView
             toParentView:self
                    edges:UIRectEdgeTop | UIRectEdgeLeft | UIRectEdgeRight
                   insets:insets];
    }

    [LayoutUtil pinView:scrollView toParentView:containerView edges:UIRectEdgeBottom];

    BOOL isNewScrollView = scrollView != _pinnedScrollView;
    if (isNewScrollView) {
      _originalIndicatorBottomInset = scrollView.scrollView.verticalScrollIndicatorInsets.bottom;
    }

    _pinnedScrollView = scrollView;
    _pinnedTopView = topSibling;
    _pinnedInsets = _contentInsets;
    _bottomInset = bottomInset;

    UIEdgeInsets contentInset = scrollView.scrollView.contentInset;
    contentInset.bottom = bottomInset;
    scrollView.scrollView.contentInset = contentInset;

    UIEdgeInsets indicatorInsets = scrollView.scrollView.verticalScrollIndicatorInsets;
    indicatorInsets.bottom = _originalIndicatorBottomInset + bottomInset;
    scrollView.scrollView.verticalScrollIndicatorInsets = indicatorInsets;
  } else if (!scrollView && _pinnedScrollView) {
    [self clearPinning];
  }
}

- (RCTScrollViewComponentView *)findScrollView:(UIView **)outTopSibling {
  if (self.subviews.count == 0) {
    return nil;
  }

  RCTScrollViewComponentView *scrollView = [self findScrollViewInSubviews:self.subviews];

  if (!scrollView) {
    for (UIView *subview in self.subviews) {
      scrollView = [self findScrollViewInSubviews:subview.subviews];
      if (scrollView) {
        break;
      }
    }
  }

  if (outTopSibling) {
    *outTopSibling = [self findTopSiblingForScrollView:scrollView];
  }

  return scrollView;
}

- (RCTScrollViewComponentView *)findScrollViewInSubviews:(NSArray<UIView *> *)subviews {
  for (UIView *subview in subviews) {
    if ([subview isKindOfClass:RCTScrollViewComponentView.class] && ![subview isKindOfClass:TrueSheetView.class]) {
      return (RCTScrollViewComponentView *)subview;
    }
  }
  return nil;
}

- (UIView *)findTopSiblingForScrollView:(RCTScrollViewComponentView *)scrollView {
  if (!scrollView || scrollView.superview != self || self.subviews.count <= 1) {
    return nil;
  }

  CGFloat scrollViewTop = CGRectGetMinY(scrollView.frame);
  UIView *topSibling = nil;
  CGFloat closestDistance = CGFLOAT_MAX;

  for (UIView *sibling in self.subviews) {
    if (sibling == scrollView || [sibling isKindOfClass:TrueSheetView.class]) {
      continue;
    }

    CGFloat siblingBottom = CGRectGetMaxY(sibling.frame);
    if (siblingBottom <= scrollViewTop) {
      CGFloat distance = scrollViewTop - siblingBottom;
      if (distance < closestDistance) {
        closestDistance = distance;
        topSibling = sibling;
      }
    }
  }

  return topSibling;
}

#pragma mark - Keyboard Handling

- (void)setupKeyboardHandler {
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(keyboardWillChangeFrame:)
                                               name:UIKeyboardWillChangeFrameNotification
                                             object:nil];
}

- (void)cleanupKeyboardHandler {
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillChangeFrameNotification object:nil];
  _currentKeyboardHeight = 0;
}

- (TrueSheetViewController *)findSheetViewController {
  UIResponder *responder = self;
  while (responder) {
    if ([responder isKindOfClass:[TrueSheetViewController class]]) {
      return (TrueSheetViewController *)responder;
    }
    responder = responder.nextResponder;
  }
  return nil;
}

- (BOOL)isFirstResponderWithinSheet {
  TrueSheetViewController *sheetController = [self findSheetViewController];
  if (!sheetController) {
    return NO;
  }

  UIView *firstResponder = [sheetController.view findFirstResponder];
  return firstResponder != nil;
}

- (void)keyboardWillChangeFrame:(NSNotification *)notification {
  if (!_pinnedScrollView) {
    return;
  }

  TrueSheetViewController *sheetController = [self findSheetViewController];
  if (sheetController && !sheetController.isTopmostPresentedController) {
    return;
  }

  if (![self isFirstResponderWithinSheet]) {
    return;
  }

  NSDictionary *userInfo = notification.userInfo;
  CGRect keyboardFrame = [userInfo[UIKeyboardFrameEndUserInfoKey] CGRectValue];
  NSTimeInterval duration = [userInfo[UIKeyboardAnimationDurationUserInfoKey] doubleValue];
  UIViewAnimationOptions curve = [userInfo[UIKeyboardAnimationCurveUserInfoKey] unsignedIntegerValue] << 16;

  UIWindow *window = self.window;
  if (!window) {
    return;
  }

  CGRect keyboardFrameInWindow = [window convertRect:keyboardFrame fromWindow:nil];
  CGFloat keyboardHeight = MAX(0, window.bounds.size.height - keyboardFrameInWindow.origin.y);

  _currentKeyboardHeight = keyboardHeight;

  // When keyboard is visible, use keyboard height only (not combined with bottom inset)
  CGFloat totalBottomInset = keyboardHeight > 0 ? keyboardHeight : _bottomInset;

  UIView *firstResponder = [sheetController.view findFirstResponder];

  [UIView animateWithDuration:duration
                        delay:0
                      options:curve | UIViewAnimationOptionBeginFromCurrentState
                   animations:^{
                     UIEdgeInsets contentInset = self->_pinnedScrollView.scrollView.contentInset;
                     contentInset.bottom = totalBottomInset;
                     self->_pinnedScrollView.scrollView.contentInset = contentInset;

                     UIEdgeInsets indicatorInsets = self->_pinnedScrollView.scrollView.verticalScrollIndicatorInsets;
                     indicatorInsets.bottom = self->_originalIndicatorBottomInset + keyboardHeight;
                     self->_pinnedScrollView.scrollView.verticalScrollIndicatorInsets = indicatorInsets;

                     if (firstResponder && keyboardHeight > 0) {
                       CGRect responderFrame = [firstResponder convertRect:firstResponder.bounds
                                                                    toView:self->_pinnedScrollView.scrollView];
                       responderFrame.size.height += self.keyboardScrollOffset;
                       [self->_pinnedScrollView.scrollView scrollRectToVisible:responderFrame animated:NO];
                     }
                   }
                   completion:nil];
}

#pragma mark - Lifecycle

- (void)prepareForRecycle {
  [super prepareForRecycle];
  [self cleanupKeyboardHandler];
  [self clearPinning];
}

@end

Class<RCTComponentViewProtocol> TrueSheetContentViewCls(void) {
  return TrueSheetContentView.class;
}

#endif
