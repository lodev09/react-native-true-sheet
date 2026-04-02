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
#import "TrueSheetContainerView.h"
#import "TrueSheetView.h"
#import "TrueSheetViewController.h"
#import "utils/PlatformUtil.h"
#import "utils/UIView+FirstResponder.h"

using namespace facebook::react;

@implementation TrueSheetContentView {
  RCTScrollViewComponentView *_pinnedScrollView;
  CGSize _lastSize;
  CGFloat _bottomInset;
  CGFloat _originalScrollViewHeight;
  CGFloat _originalIndicatorBottomInset;
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

  CGSize newSize = CGSizeMake(layoutMetrics.frame.size.width, layoutMetrics.frame.size.height);
  if (!CGSizeEqualToSize(newSize, _lastSize)) {
    _lastSize = newSize;
    [self.delegate contentViewDidChangeSize:newSize];
  }
}

#pragma mark - Child Mounting

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [super mountChildComponentView:childComponentView index:index];
  [self checkScrollViewChanged];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [super unmountChildComponentView:childComponentView index:index];
  [self checkScrollViewChanged];
}

- (void)checkScrollViewChanged {
  if (!_pinnedScrollView || ![_pinnedScrollView isDescendantOfView:self]) {
    [self.delegate contentViewScrollViewDidChange];
  }
}

#pragma mark - Scrollable

- (void)setScrollViewContentInset:(CGFloat)contentBottom indicatorInset:(CGFloat)indicatorBottom {
  if (!_pinnedScrollView)
    return;

  UIEdgeInsets contentInset = _pinnedScrollView.scrollView.contentInset;
  contentInset.bottom = contentBottom;
  _pinnedScrollView.scrollView.contentInset = contentInset;

  UIEdgeInsets indicatorInsets = _pinnedScrollView.scrollView.verticalScrollIndicatorInsets;
  indicatorInsets.bottom = indicatorBottom;
  _pinnedScrollView.scrollView.verticalScrollIndicatorInsets = indicatorInsets;
}

- (void)clearScrollable {
  if (_pinnedScrollView) {
    CGRect frame = _pinnedScrollView.frame;
    frame.size.height = _originalScrollViewHeight;
    _pinnedScrollView.frame = frame;

    [self setScrollViewContentInset:0 indicatorInset:_originalIndicatorBottomInset];
  }
  _pinnedScrollView = nil;
  _bottomInset = 0;
  _originalScrollViewHeight = 0;
  _originalIndicatorBottomInset = 0;
}

- (void)setupScrollable:(BOOL)enabled bottomInset:(CGFloat)bottomInset {
  if (!enabled) {
    [self clearScrollable];
    return;
  }

  // Check if pinned scroll view is still valid (still in view hierarchy)
  if (_pinnedScrollView && ![_pinnedScrollView isDescendantOfView:self]) {
    [self clearScrollable];
  }

  // Already set up with same inset and valid scroll view
  if (_pinnedScrollView && _bottomInset == bottomInset) {
    return;
  }

  RCTScrollViewComponentView *scrollView = [self findScrollView];
  if (!scrollView) {
    return;
  }

  // Only capture originals on first pin
  if (!_pinnedScrollView) {
    _originalScrollViewHeight = scrollView.frame.size.height;
    _originalIndicatorBottomInset = scrollView.scrollView.verticalScrollIndicatorInsets.bottom;
    _pinnedScrollView = scrollView;
  }

  _bottomInset = bottomInset;

  [self updateScrollViewHeight];

  [self setScrollViewContentInset:_bottomInset indicatorInset:_originalIndicatorBottomInset];

  // If keyboard is currently showing, re-apply the keyboard inset to the new ScrollView
  CGFloat keyboardHeight = _keyboardObserver ? _keyboardObserver.currentHeight : 0;
  if (keyboardHeight > 0) {
    [self setScrollViewContentInset:keyboardHeight indicatorInset:_originalIndicatorBottomInset + keyboardHeight];
  }
}

- (void)updateScrollViewHeight {
  if (!_pinnedScrollView) {
    return;
  }

  UIView *containerView = self.superview;
  if (!containerView) {
    return;
  }

  CGRect scrollViewFrameInContainer = [_pinnedScrollView.superview convertRect:_pinnedScrollView.frame
                                                                        toView:containerView];
  CGFloat newHeight = containerView.bounds.size.height - scrollViewFrameInContainer.origin.y;

  if (newHeight > 0) {
    // Preserve contentOffset before changing frame to prevent scroll jump
    CGPoint savedContentOffset = _pinnedScrollView.scrollView.contentOffset;

    CGRect frame = _pinnedScrollView.frame;
    frame.size.height = newHeight;
    _pinnedScrollView.frame = frame;

    // Restore contentOffset after frame change
    _pinnedScrollView.scrollView.contentOffset = savedContentOffset;
  }
}

- (RCTScrollViewComponentView *)findScrollView {
  if (_pinnedScrollView) {
    return _pinnedScrollView;
  }

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

#pragma mark - Scroll Edge Effects

- (void)applyScrollEdgeEffects:(nullable ScrollableOptions *)options {
#if RNTS_IPHONE_OS_VERSION_AVAILABLE(26_0)
  if (!_pinnedScrollView)
    return;

  if (@available(iOS 26.0, *)) {
    UIScrollView *scrollView = _pinnedScrollView.scrollView;
    auto topEffect = options ? options.topScrollEdgeEffect : TrueSheetViewTopScrollEdgeEffect::Hidden;
    auto bottomEffect = options ? options.bottomScrollEdgeEffect : TrueSheetViewBottomScrollEdgeEffect::Hidden;

    [self applyEdgeEffect:topEffect toEdge:scrollView.topEdgeEffect];
    [self applyEdgeEffect:(TrueSheetViewTopScrollEdgeEffect)bottomEffect toEdge:scrollView.bottomEdgeEffect];
  }
#endif
}

#if RNTS_IPHONE_OS_VERSION_AVAILABLE(26_0)
- (void)applyEdgeEffect:(TrueSheetViewTopScrollEdgeEffect)effect
                 toEdge:(UIScrollEdgeEffect *)edgeEffect API_AVAILABLE(ios(26.0)) {
  switch (effect) {
    case TrueSheetViewTopScrollEdgeEffect::Automatic:
      edgeEffect.hidden = NO;
      edgeEffect.style = UIScrollEdgeEffectStyle.automaticStyle;
      break;
    case TrueSheetViewTopScrollEdgeEffect::Hard:
      edgeEffect.hidden = NO;
      edgeEffect.style = UIScrollEdgeEffectStyle.hardStyle;
      break;
    case TrueSheetViewTopScrollEdgeEffect::Soft:
      edgeEffect.hidden = NO;
      edgeEffect.style = UIScrollEdgeEffectStyle.softStyle;
      break;
    case TrueSheetViewTopScrollEdgeEffect::Hidden:
      edgeEffect.hidden = YES;
      break;
  }
}
#endif

#pragma mark - TrueSheetKeyboardObserverDelegate

- (void)keyboardWillShow:(CGFloat)height duration:(NSTimeInterval)duration curve:(UIViewAnimationOptions)curve {
  if (!_pinnedScrollView) {
    return;
  }

  TrueSheetViewController *sheetController = _keyboardObserver.viewController;
  UIView *firstResponder = sheetController ? [sheetController.view findFirstResponder] : nil;

  [UIView animateWithDuration:duration
                        delay:0
                      options:curve | UIViewAnimationOptionBeginFromCurrentState
                   animations:^{
                     [self setScrollViewContentInset:height
                                      indicatorInset:self->_originalIndicatorBottomInset + height];
                   }
                   completion:nil];

  // Defer scroll until the next run loop so content insets are applied first
  if (firstResponder) {
    dispatch_async(dispatch_get_main_queue(), ^{
      CGRect responderFrame = [firstResponder convertRect:firstResponder.bounds
                                                   toView:self->_pinnedScrollView.scrollView];
      responderFrame.size.height += self.keyboardScrollOffset;
      [self->_pinnedScrollView.scrollView scrollRectToVisible:responderFrame animated:YES];
    });
  }
}

- (void)keyboardWillHide:(NSTimeInterval)duration curve:(UIViewAnimationOptions)curve {
  if (!_pinnedScrollView) {
    return;
  }

  [UIView animateWithDuration:duration
                        delay:0
                      options:curve | UIViewAnimationOptionBeginFromCurrentState
                   animations:^{
                     [self setScrollViewContentInset:self->_bottomInset
                                      indicatorInset:self->_originalIndicatorBottomInset];
                   }
                   completion:nil];
}

#pragma mark - Lifecycle

- (void)prepareForRecycle {
  [super prepareForRecycle];
  [self clearScrollable];
}

@end

Class<RCTComponentViewProtocol> TrueSheetContentViewCls(void) {
  return TrueSheetContentView.class;
}

#endif
