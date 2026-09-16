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
  UIScrollViewContentInsetAdjustmentBehavior _originalInsetAdjustmentBehavior;
  BOOL _appliedSafeAreaInsetAdjustment;
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

- (void)setScrollableHandle:(NSInteger)scrollableHandle {
  if (_scrollableHandle == scrollableHandle) {
    return;
  }
  _scrollableHandle = scrollableHandle;

  // Release the previously resolved ScrollView — setupScrollable re-resolves
  [self clearScrollable];
}

- (void)setSafeAreaInsetAdjustment:(BOOL)safeAreaInsetAdjustment {
  if (_safeAreaInsetAdjustment == safeAreaInsetAdjustment) {
    return;
  }
  _safeAreaInsetAdjustment = safeAreaInsetAdjustment;
  [self applySafeAreaInsetAdjustment];
  [self updateBottomInset];
}

- (void)setFooterInsetAdjustment:(BOOL)footerInsetAdjustment {
  if (_footerInsetAdjustment == footerInsetAdjustment) {
    return;
  }
  _footerInsetAdjustment = footerInsetAdjustment;
  [self updateBottomInset];
}

// Hands the bottom safe-area inset to UIKit — `automatic` only insets while
// the content can scroll, which the Android counterpart mirrors manually.
- (void)applySafeAreaInsetAdjustment {
  if (!_detectedScrollView) {
    return;
  }

  UIScrollView *scrollView = _detectedScrollView.scrollView;
  if (_safeAreaInsetAdjustment && !_appliedSafeAreaInsetAdjustment) {
    _originalInsetAdjustmentBehavior = scrollView.contentInsetAdjustmentBehavior;
    scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentAutomatic;
    _appliedSafeAreaInsetAdjustment = YES;
  } else if (!_safeAreaInsetAdjustment && _appliedSafeAreaInsetAdjustment) {
    scrollView.contentInsetAdjustmentBehavior = _originalInsetAdjustmentBehavior;
    _appliedSafeAreaInsetAdjustment = NO;
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

// A handle that commits in the same transaction as the ScrollView's insertion
// resolves to nothing — prop updates process before mount instructions, and a
// deep insertion doesn't pass through this view's mount hooks. Retry once the
// whole transaction has mounted.
- (void)mountingTransactionDidMount:(const MountingTransaction &)transaction
               withSurfaceTelemetry:(const SurfaceTelemetry &)surfaceTelemetry {
  if (_scrollableHandle > 0 && !_detectedScrollView) {
    [self.delegate contentViewScrollViewDidChange];
  }

  // Layout has settled for the whole tree — the footer overlap (sheet height,
  // scroll view frame) and the keyboard inset are current here
  [self updateBottomInset];
}

#pragma mark - Scrollable

// The scroll indicator follows automatically — UIKit derives its insets from
// the content inset while `automaticallyAdjustsScrollIndicatorInsets` is set.
- (void)setBottomInset:(CGFloat)inset {
  if (!_detectedScrollView)
    return;

  UIEdgeInsets contentInset = _detectedScrollView.scrollView.contentInset;
  if (fabs(contentInset.bottom - inset) < 0.001) {
    return;
  }

  contentInset.bottom = inset;
  _detectedScrollView.scrollView.contentInset = contentInset;
}

// How much of the absolute footer covers the scroll view — measured from the
// footer's layout position (pinned to the container's bottom edge; its
// keyboard rise is a transform) so a short scroll view ending above the footer
// gets no inset. UIKit stacks the safe area on top of contentInset while the
// adjustment behavior is automatic — take out the inset baked into the
// footer's height so the total lands on the footer's top edge. Stays constant
// across keyboard transitions: the footer drops its inset as it rises, and
// the baked value drops with it. A pinned footer adds only the overlap not
// already covered by the keyboard inset.
- (CGFloat)footerInsetAbove:(CGFloat)keyboardInset {
  if (!_footerInsetAdjustment || !self.footerView || !_detectedScrollView) {
    return 0;
  }

  UIView *container = self.footerView.superview;
  UIScrollView *scrollView = _detectedScrollView.scrollView;
  CGRect scrollFrame = [scrollView convertRect:scrollView.bounds toView:container];
  CGFloat footerTop = container.bounds.size.height - self.footerView.bounds.size.height;

  CGFloat inset = CGRectGetMaxY(scrollFrame) - footerTop;
  if (_appliedSafeAreaInsetAdjustment) {
    inset -= self.footerView.appliedBottomInset;
  }
  if (!_keyboardObserver.viewController.footerAvoidsKeyboard) {
    inset -= keyboardInset;
  }
  return MAX(0, inset);
}

- (CGFloat)keyboardInset {
  CGFloat keyboardHeight = _keyboardObserver.currentHeight;
  return keyboardHeight > 0 ? [self keyboardInsetWithHeight:keyboardHeight] : 0;
}

// Safe to call mid keyboard animation: the target matches the animation's
// model value (the footer inset doesn't change with the keyboard), so the
// early-out in setBottomInset: leaves the animation alone.
- (void)updateBottomInset {
  if (!_detectedScrollView) {
    return;
  }
  CGFloat keyboardInset = [self keyboardInset];
  [self setBottomInset:[self footerInsetAbove:keyboardInset] + keyboardInset];
}

- (void)clearScrollable {
  [self setBottomInset:0];
  _appliedKeyboardOffset = 0;
  if (_appliedSafeAreaInsetAdjustment) {
    _detectedScrollView.scrollView.contentInsetAdjustmentBehavior = _originalInsetAdjustmentBehavior;
    _appliedSafeAreaInsetAdjustment = NO;
  }
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

  [self applySafeAreaInsetAdjustment];

  // Apply the footer inset, and the keyboard inset if it's currently showing
  [self updateBottomInset];
}

// Short or nested scroll views can end above the sheet's bottom edge.
// Their frame also accounts for space occupied by a relative footer.
- (CGFloat)keyboardInsetWithHeight:(CGFloat)height {
  UIScrollView *scrollView = _detectedScrollView.scrollView;
  UIWindow *window = scrollView.window;
  CGRect scrollFrame = [scrollView convertRect:scrollView.bounds toView:window];
  CGFloat keyboardTop = CGRectGetMaxY(window.bounds) - height;
  CGFloat inset = MAX(0, CGRectGetMaxY(scrollFrame) - keyboardTop);

  // UIKit stacks the safe area on top of contentInset while the adjustment
  // behavior is automatic — take it out so the total lands on the keyboard edge.
  if (_appliedSafeAreaInsetAdjustment) {
    inset = MAX(0, inset - scrollView.safeAreaInsets.bottom);
  }

  // Track how much of keyboardOffset actually lands in the inset so the caret
  // reveal can compensate — the offset shifts the inset, not the keyboard edge.
  CGFloat adjustedInset = MAX(0, inset + self.keyboardOffset);
  _appliedKeyboardOffset =
    adjustedInset + [self footerInsetAbove:adjustedInset] - (inset + [self footerInsetAbove:inset]);

  // Content that already fits above the keyboard (and footer) has nothing to
  // reveal — the inset would only open blank scroll range below it (huge gap
  // at the bottom).
  if (scrollView.contentSize.height + [self footerInsetAbove:adjustedInset] <=
      scrollView.bounds.size.height - adjustedInset) {
    _appliedKeyboardOffset = 0;
    return 0;
  }

  return adjustedInset;
}

// An absolute footer floats over the viewport's bottom edge — extend the
// caret target so it clears the footer, not just the keyboard. Not needed
// while the footer inset is applied (the visible rect already ends above it)
// or when the footer stays behind the keyboard.
- (CGFloat)footerOcclusion {
  TrueSheetViewController *controller = _keyboardObserver.viewController;
  if (self.footerView && controller.absoluteFooter && controller.footerAvoidsKeyboard &&
      [self footerInsetAbove:0] <= 0) {
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

  CGFloat keyboardInset = [self keyboardInsetWithHeight:height];
  CGFloat inset = [self footerInsetAbove:keyboardInset] + keyboardInset;
  [UIView animateWithDuration:duration
    delay:0
    options:curve | UIViewAnimationOptionBeginFromCurrentState
    animations:^{
      [self setBottomInset:inset];
    }
    completion:^(BOOL finished) {
      [self updateBottomInset];
    }];

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
    [self updateBottomInset];
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
                     [self setBottomInset:[self footerInsetAbove:0]];
                   }
                   completion:nil];
}

#pragma mark - Lifecycle

- (void)prepareForRecycle {
  [super prepareForRecycle];
  [self stopObservingTextChanges];
  [self clearScrollable];
  _state.reset();
  _scrollableHandle = 0;
  _safeAreaInsetAdjustment = NO;
  _footerInsetAdjustment = NO;
  _lastReportedNaturalHeight = 0;
}

@end

Class<RCTComponentViewProtocol> TrueSheetContentViewCls(void) {
  return TrueSheetContentView.class;
}

#endif
