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
#import <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>
#import <react/renderer/components/TrueSheetSpec/RCTComponentViewHelpers.h>
#import <react/renderer/components/TrueSheetSpec/TrueSheetContentViewComponentDescriptor.h>
#import <react/renderer/components/TrueSheetSpec/TrueSheetContentViewShadowNode.h>
#import "TrueSheetContainerView.h"
#import "TrueSheetFooterView.h"
#import "TrueSheetView.h"
#import "TrueSheetViewController.h"
#import "utils/PlatformUtil.h"
#import "utils/UIView+FirstResponder.h"

using namespace facebook::react;

static void *TrueSheetContentSizeContext = &TrueSheetContentSizeContext;

@implementation TrueSheetContentView {
  TrueSheetContentViewShadowNode::ConcreteState::Shared _state;
  RCTScrollViewComponentView *_pinnedScrollView;
  UIScrollView *_observedScrollView;
  CGSize _lastSize;
  CGFloat _bottomInset;
  CGFloat _originalIndicatorBottomInset;
  BOOL _observingTextChanges;
  BOOL _scrollableBounded;
  BOOL _isReportPending;
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

- (void)dealloc {
  [self stopObservingTextChanges];
  [self unobserveScrollViewContentSize];
}

- (void)updateState:(const State::Shared &)state oldState:(const State::Shared &)oldState {
  _state = std::static_pointer_cast<TrueSheetContentViewShadowNode::ConcreteState const>(state);
}

// Tells the shadow node to fill the container (flexGrow/flexShrink) so the
// pinned ScrollView's viewport is bounded to the visible space. Only applied
// for auto detents — otherwise content lays out naturally like a regular view.
- (void)setScrollableBounded:(BOOL)bounded {
  if (_scrollableBounded == bounded) {
    return;
  }
  _scrollableBounded = bounded;

  if (_state) {
    TrueSheetContentViewState newState;
    newState.scrollableBounded = bounded;
    _state->updateState(std::move(newState));
  }
}

- (void)setHasAutoDetent:(BOOL)hasAutoDetent {
  if (_hasAutoDetent == hasAutoDetent) {
    return;
  }
  _hasAutoDetent = hasAutoDetent;

  if (_pinnedScrollView) {
    [self setScrollableBounded:hasAutoDetent];
  }
}

#pragma mark - Text Change Observing

// The notification is app-wide (object:nil), so only observe while the keyboard is up
- (void)startObservingTextChanges {
  if (_observingTextChanges) {
    return;
  }
  _observingTextChanges = YES;
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(focusedInputTextDidChange:)
                                               name:UITextViewTextDidChangeNotification
                                             object:nil];
}

- (void)stopObservingTextChanges {
  if (!_observingTextChanges) {
    return;
  }
  _observingTextChanges = NO;
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UITextViewTextDidChangeNotification object:nil];
}

#pragma mark - Layout

- (CGFloat)naturalHeight {
  CGFloat height = self.frame.size.height;
  if (_pinnedScrollView) {
    height += _pinnedScrollView.scrollView.contentSize.height - _pinnedScrollView.frame.size.height;
  }
  return MAX(0, height);
}

- (void)reportSizeIfChanged {
  // naturalHeight mixes frames from different views; mid-transaction they're
  // momentarily inconsistent (parent updates before the ScrollView), which
  // feeds back into the auto detent and oscillates. Coalesce to the next
  // main-queue tick so frames are settled before measuring.
  if (_pinnedScrollView) {
    if (_isReportPending) {
      return;
    }
    _isReportPending = YES;

    __weak __typeof(self) weakSelf = self;
    dispatch_async(dispatch_get_main_queue(), ^{
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) {
        return;
      }
      strongSelf->_isReportPending = NO;
      [strongSelf reportSizeNow];
    });
    return;
  }

  [self reportSizeNow];
}

- (void)reportSizeNow {
  CGSize newSize = CGSizeMake(self.frame.size.width, self.naturalHeight);
  if (!CGSizeEqualToSize(newSize, _lastSize)) {
    _lastSize = newSize;
    [self.delegate contentViewDidChangeSize:newSize];
  }
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics {
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];
  [self reportSizeIfChanged];
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
    [self setScrollViewContentInset:0 indicatorInset:_originalIndicatorBottomInset];
  }
  [self unobserveScrollViewContentSize];
  [self setScrollableBounded:NO];
  _pinnedScrollView = nil;
  _bottomInset = 0;
  _originalIndicatorBottomInset = 0;
  [self reportSizeIfChanged];
}

- (void)setupScrollableWithBottomInset:(CGFloat)bottomInset {
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
    _originalIndicatorBottomInset = scrollView.scrollView.verticalScrollIndicatorInsets.bottom;
    _pinnedScrollView = scrollView;

    [self observeScrollViewContentSize];
    [self setScrollableBounded:_hasAutoDetent];
    [self reportSizeIfChanged];
  }

  _bottomInset = bottomInset;

  [self setScrollViewContentInset:_bottomInset indicatorInset:_originalIndicatorBottomInset];

  // If keyboard is currently showing, re-apply the keyboard inset to the new ScrollView
  CGFloat keyboardHeight = _keyboardObserver ? _keyboardObserver.currentHeight : 0;
  if (keyboardHeight > 0) {
    CGFloat inset = [self keyboardInsetWithHeight:keyboardHeight];
    [self setScrollViewContentInset:inset indicatorInset:_originalIndicatorBottomInset + inset];
  }
}

// An absolute footer rises above the keyboard and covers the content's bottom
// edge — include it so the caret clears the footer, not just the keyboard.
// A relative footer stays behind the keyboard below the content, so its
// height shields that much of the keyboard's overlap.
- (CGFloat)keyboardInsetWithHeight:(CGFloat)height {
  if (!self.footerView) {
    return height;
  }
  if (_keyboardObserver.viewController.absoluteFooter) {
    return height + [self.footerView keyboardOcclusionHeight];
  }
  return MAX(0, height - self.footerView.frame.size.height);
}

// Content growth is invisible to layout once the viewport is bounded, so track
// the scroll content size directly to keep the auto detent height in sync.
- (void)observeScrollViewContentSize {
  UIScrollView *scrollView = _pinnedScrollView.scrollView;
  if (_observedScrollView == scrollView) {
    return;
  }
  [self unobserveScrollViewContentSize];
  _observedScrollView = scrollView;
  [scrollView addObserver:self
               forKeyPath:@"contentSize"
                  options:NSKeyValueObservingOptionNew
                  context:TrueSheetContentSizeContext];
}

- (void)unobserveScrollViewContentSize {
  if (_observedScrollView) {
    [_observedScrollView removeObserver:self forKeyPath:@"contentSize" context:TrueSheetContentSizeContext];
    _observedScrollView = nil;
  }
}

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary *)change
                       context:(void *)context {
  if (context == TrueSheetContentSizeContext) {
    [self reportSizeIfChanged];
    return;
  }
  [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
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

  [self startObservingTextChanges];

  TrueSheetViewController *sheetController = _keyboardObserver.viewController;
  UIView *firstResponder = sheetController ? [sheetController.view findFirstResponder] : nil;

  CGFloat inset = [self keyboardInsetWithHeight:height];
  [UIView animateWithDuration:duration
                        delay:0
                      options:curve | UIViewAnimationOptionBeginFromCurrentState
                   animations:^{
                     [self setScrollViewContentInset:inset
                                      indicatorInset:self->_originalIndicatorBottomInset + inset];
                   }
                   completion:nil];

  // Defer scroll until the next run loop so content insets are applied first
  if (firstResponder) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [self scrollToFocusedCaretAnimated:YES];
    });
  }
}

- (void)focusedInputTextDidChange:(NSNotification *)notification {
  if (!_pinnedScrollView || !_keyboardObserver || _keyboardObserver.currentHeight <= 0) {
    return;
  }

  TrueSheetViewController *sheetController = _keyboardObserver.viewController;
  UIView *firstResponder = sheetController ? [sheetController.view findFirstResponder] : nil;
  if (!firstResponder || notification.object != firstResponder) {
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    [self scrollToFocusedCaretAnimated:YES];
  });
}

- (void)scrollToFocusedCaretAnimated:(BOOL)animated {
  if (!_pinnedScrollView) {
    return;
  }

  TrueSheetViewController *sheetController = _keyboardObserver.viewController;
  UIView *firstResponder = sheetController ? [sheetController.view findFirstResponder] : nil;
  if (!firstResponder) {
    return;
  }

  UIScrollView *scrollView = _pinnedScrollView.scrollView;
  CGRect targetRect = [firstResponder convertRect:firstResponder.bounds toView:scrollView];

  if ([firstResponder conformsToProtocol:@protocol(UITextInput)]) {
    id<UITextInput> textInput = (id<UITextInput>)firstResponder;
    UITextRange *selectedRange = textInput.selectedTextRange;
    if (selectedRange) {
      CGRect caretRect = [textInput caretRectForPosition:selectedRange.end];
      // caretRectForPosition: can return non-finite coordinates during layout/selection transitions
      BOOL caretRectValid = !CGRectIsNull(caretRect) && !CGRectIsInfinite(caretRect) && isfinite(caretRect.origin.x) &&
                            isfinite(caretRect.origin.y) && isfinite(caretRect.size.width) &&
                            isfinite(caretRect.size.height);
      if (caretRectValid) {
        targetRect = [firstResponder convertRect:caretRect toView:scrollView];
      }
    }
  }

  targetRect.size.height += self.keyboardScrollOffset;
  [scrollView scrollRectToVisible:targetRect animated:animated];
}

- (void)keyboardWillHide:(NSTimeInterval)duration curve:(UIViewAnimationOptions)curve {
  [self stopObservingTextChanges];

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
  [self stopObservingTextChanges];
  [self clearScrollable];
  _state.reset();
  _scrollableBounded = NO;
  _hasAutoDetent = NO;
  _lastSize = CGSizeZero;
}

@end

Class<RCTComponentViewProtocol> TrueSheetContentViewCls(void) {
  return TrueSheetContentView.class;
}

#endif
