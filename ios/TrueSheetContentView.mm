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
#import "TrueSheetViewController.h"
#import "utils/PlatformUtil.h"
#import "utils/UIView+FirstResponder.h"

using namespace facebook::react;

@implementation TrueSheetContentView {
  TrueSheetContentViewShadowNode::ConcreteState::Shared _state;
  RCTScrollViewComponentView *_detectedScrollView;
  CGFloat _lastReportedNaturalHeight;
  CGFloat _appliedKeyboardOffset;
  BOOL _observingTextChanges;
  BOOL _scrollableBounded;
  UIScrollViewContentInsetAdjustmentBehavior _originalInsetAdjustmentBehavior;
  BOOL _appliedContentInsetAdjustment;
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
}

- (void)updateState:(const State::Shared &)state oldState:(const State::Shared &)oldState {
  _state = std::static_pointer_cast<TrueSheetContentViewShadowNode::ConcreteState const>(state);

  CGFloat naturalHeight = _state->getData().naturalHeight;
  if (naturalHeight != _lastReportedNaturalHeight) {
    _lastReportedNaturalHeight = naturalHeight;
    [self.delegate contentViewDidChangeSize:CGSizeMake(self.frame.size.width, naturalHeight)];
  }
}

// Tells the shadow node to fill the container (flexGrow/flexShrink) so the
// detected ScrollView's viewport is bounded to the visible space. Only applied
// for auto detents — otherwise content lays out naturally like a regular view.
- (void)setScrollableBounded:(BOOL)bounded {
  if (_scrollableBounded == bounded) {
    return;
  }
  _scrollableBounded = bounded;

  if (_state) {
    auto newState = _state->getData();
    newState.scrollableBounded = bounded;
    _state->updateState(std::move(newState));
  }
}

- (void)setScrollableHandle:(NSInteger)scrollableHandle {
  if (_scrollableHandle == scrollableHandle) {
    return;
  }
  _scrollableHandle = scrollableHandle;

  // Release the previously resolved ScrollView — setupScrollable re-resolves
  [self clearScrollable];
}

- (void)setContentInsetAdjustment:(BOOL)contentInsetAdjustment {
  if (_contentInsetAdjustment == contentInsetAdjustment) {
    return;
  }
  _contentInsetAdjustment = contentInsetAdjustment;
  [self applyContentInsetAdjustment];
}

// Hands the bottom safe-area inset to UIKit — `automatic` only insets while
// the content can scroll, which the Android counterpart mirrors manually.
- (void)applyContentInsetAdjustment {
  if (!_detectedScrollView) {
    return;
  }

  UIScrollView *scrollView = _detectedScrollView.scrollView;
  if (_contentInsetAdjustment && !_appliedContentInsetAdjustment) {
    _originalInsetAdjustmentBehavior = scrollView.contentInsetAdjustmentBehavior;
    scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentAutomatic;
    _appliedContentInsetAdjustment = YES;
  } else if (!_contentInsetAdjustment && _appliedContentInsetAdjustment) {
    scrollView.contentInsetAdjustmentBehavior = _originalInsetAdjustmentBehavior;
    _appliedContentInsetAdjustment = NO;
  }
}

- (void)setHasAutoDetent:(BOOL)hasAutoDetent {
  if (_hasAutoDetent == hasAutoDetent) {
    return;
  }
  _hasAutoDetent = hasAutoDetent;

  if (_detectedScrollView) {
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
  if (_state) {
    CGFloat height = _state->getData().naturalHeight;
    if (height > 0) {
      return height;
    }
  }
  return self.frame.size.height;
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics {
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  // A deep ScrollView unmount doesn't pass through this view's mount hooks —
  // detect the stale reference here so it's released instead of lingering until the
  // next explicit setup or recycle.
  if (_detectedScrollView && ![_detectedScrollView isDescendantOfView:self]) {
    [self.delegate contentViewScrollViewDidChange];
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
  if (!_detectedScrollView || ![_detectedScrollView isDescendantOfView:self]) {
    [self.delegate contentViewScrollViewDidChange];
  }
}

#pragma mark - Scrollable

// The scroll indicator follows automatically — UIKit derives its insets from
// the content inset while `automaticallyAdjustsScrollIndicatorInsets` is set.
- (void)setKeyboardInset:(CGFloat)inset {
  if (!_detectedScrollView)
    return;

  UIEdgeInsets contentInset = _detectedScrollView.scrollView.contentInset;
  contentInset.bottom = inset;
  _detectedScrollView.scrollView.contentInset = contentInset;
}

- (void)clearScrollable {
  [self setKeyboardInset:0];
  _appliedKeyboardOffset = 0;
  if (_appliedContentInsetAdjustment) {
    _detectedScrollView.scrollView.contentInsetAdjustmentBehavior = _originalInsetAdjustmentBehavior;
    _appliedContentInsetAdjustment = NO;
  }
  [self setScrollableBounded:NO];
  _detectedScrollView = nil;
}

- (void)setupScrollable {
  // Check if the detected scroll view is still valid (still in view hierarchy)
  if (_detectedScrollView && ![_detectedScrollView isDescendantOfView:self]) {
    [self clearScrollable];
  }

  if (_detectedScrollView) {
    return;
  }

  RCTScrollViewComponentView *scrollView = [self findScrollView];
  if (!scrollView) {
    return;
  }

  _detectedScrollView = scrollView;

  [self applyContentInsetAdjustment];
  [self setScrollableBounded:_hasAutoDetent];

  // If keyboard is currently showing, re-apply the keyboard inset to the new ScrollView
  CGFloat keyboardHeight = _keyboardObserver ? _keyboardObserver.currentHeight : 0;
  if (keyboardHeight > 0) {
    [self setKeyboardInset:[self keyboardInsetWithHeight:keyboardHeight]];
  }
}

// A relative footer stays behind the keyboard below the content, so its
// height shields that much of the keyboard's overlap. An absolute footer
// floats within the viewport — its clearance is the content padding's job
// (the caret reveal accounts for it, see footerOcclusion).
- (CGFloat)keyboardInsetWithHeight:(CGFloat)height {
  CGFloat inset = height;
  if (self.footerView && !_keyboardObserver.viewController.absoluteFooter) {
    inset = MAX(0, height - self.footerView.frame.size.height);
  }

  // UIKit stacks the safe area on top of contentInset while the adjustment
  // behavior is automatic — take it out so the total lands on the keyboard edge.
  if (_appliedContentInsetAdjustment) {
    inset = MAX(0, inset - _detectedScrollView.scrollView.safeAreaInsets.bottom);
  }

  // Track how much of keyboardOffset actually lands in the inset so the caret
  // reveal can compensate — the offset shifts the inset, not the keyboard edge.
  CGFloat adjustedInset = MAX(0, inset + self.keyboardOffset);
  _appliedKeyboardOffset = adjustedInset - inset;

  // Content that already fits above the keyboard has nothing to reveal — the
  // inset would only open blank scroll range below it (huge gap at the bottom).
  UIScrollView *scrollView = _detectedScrollView.scrollView;
  if (scrollView.contentSize.height <= scrollView.bounds.size.height - adjustedInset) {
    _appliedKeyboardOffset = 0;
    return 0;
  }

  return adjustedInset;
}

// An absolute footer floats over the viewport's bottom edge — extend the
// caret target so it clears the footer, not just the keyboard.
- (CGFloat)footerOcclusion {
  if (self.footerView && _keyboardObserver.viewController.absoluteFooter) {
    return [self.footerView keyboardOcclusionHeight];
  }
  return 0;
}

// Resolves the user-provided `scrollableHandle` within the content subtree —
// Fabric component views carry their React tag as `UIView.tag`.
- (RCTScrollViewComponentView *)findScrollView {
  if (_detectedScrollView) {
    return _detectedScrollView;
  }

  if (_scrollableHandle <= 0) {
    return nil;
  }

  UIView *view = [self viewWithTag:_scrollableHandle];
  if ([view isKindOfClass:RCTScrollViewComponentView.class]) {
    return (RCTScrollViewComponentView *)view;
  }

  return nil;
}

#pragma mark - Scroll Edge Effects

- (void)applyScrollEdgeEffects:(nullable ScrollableOptions *)options {
#if RNTS_IPHONE_OS_VERSION_AVAILABLE(26_0)
  if (!_detectedScrollView)
    return;

  if (@available(iOS 26.0, *)) {
    UIScrollView *scrollView = _detectedScrollView.scrollView;
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
  if (!_detectedScrollView) {
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
                     [self setKeyboardInset:inset];
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
  if (!_detectedScrollView || !_keyboardObserver || _keyboardObserver.currentHeight <= 0) {
    return;
  }

  TrueSheetViewController *sheetController = _keyboardObserver.viewController;
  UIView *firstResponder = sheetController ? [sheetController.view findFirstResponder] : nil;
  if (!firstResponder || notification.object != firstResponder) {
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    // Typing can grow the content (e.g. a multiline input) past the fits-above-
    // the-keyboard threshold — keep the inset in sync before revealing the caret.
    [self setKeyboardInset:[self keyboardInsetWithHeight:self->_keyboardObserver.currentHeight]];
    [self scrollToFocusedCaretAnimated:YES];
  });
}

- (void)scrollToFocusedCaretAnimated:(BOOL)animated {
  if (!_detectedScrollView) {
    return;
  }

  TrueSheetViewController *sheetController = _keyboardObserver.viewController;
  UIView *firstResponder = sheetController ? [sheetController.view findFirstResponder] : nil;
  if (!firstResponder) {
    return;
  }

  UIScrollView *scrollView = _detectedScrollView.scrollView;
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

  targetRect.size.height += self.keyboardScrollOffset + [self footerOcclusion] - _appliedKeyboardOffset;
  [scrollView scrollRectToVisible:targetRect animated:animated];
}

- (void)keyboardWillHide:(NSTimeInterval)duration curve:(UIViewAnimationOptions)curve {
  [self stopObservingTextChanges];

  if (!_detectedScrollView) {
    return;
  }

  [UIView animateWithDuration:duration
                        delay:0
                      options:curve | UIViewAnimationOptionBeginFromCurrentState
                   animations:^{
                     [self setKeyboardInset:0];
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
  _scrollableHandle = 0;
  _contentInsetAdjustment = NO;
  _hasAutoDetent = NO;
  _lastReportedNaturalHeight = 0;
}

@end

Class<RCTComponentViewProtocol> TrueSheetContentViewCls(void) {
  return TrueSheetContentView.class;
}

#endif
