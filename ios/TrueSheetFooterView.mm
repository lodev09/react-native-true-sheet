//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "TrueSheetFooterView.h"
#import <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>
#import <react/renderer/components/TrueSheetSpec/RCTComponentViewHelpers.h>
#import <react/renderer/components/TrueSheetSpec/TrueSheetFooterViewComponentDescriptor.h>
#import <react/renderer/components/TrueSheetSpec/TrueSheetFooterViewShadowNode.h>
#import "TrueSheetViewController.h"
#import "utils/UIView+ScrollEdgeInteraction.h"

using namespace facebook::react;

@implementation TrueSheetFooterView {
  TrueSheetFooterViewShadowNode::ConcreteState::Shared _state;
  CGFloat _lastHeight;
  CGFloat _currentKeyboardOffset;
  CGFloat _bottomInset;
  BOOL _keyboardVisible;
  BOOL _didPushBottomInset;
  CGFloat _appliedBottomInset;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<TrueSheetFooterViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const TrueSheetFooterViewProps>();
    _props = defaultProps;

    self.backgroundColor = [UIColor clearColor];
    self.isAccessibilityElement = NO;

    _lastHeight = 0;
    _currentKeyboardOffset = 0;
    _bottomInset = 0;
    _keyboardVisible = NO;
    _didPushBottomInset = NO;
    _appliedBottomInset = 0;
  }
  return self;
}

- (void)updateState:(const State::Shared &)state oldState:(const State::Shared &)oldState {
  _state = std::static_pointer_cast<TrueSheetFooterViewShadowNode::ConcreteState const>(state);
}

// Tells the shadow node to pad the footer's bottom edge with the sheet's
// bottom safe-area inset — the footer owns the sheet's bottom edge, so it
// absorbs the inset and its background fills it.
- (void)setBottomInset:(CGFloat)bottomInset {
  // The first push must go through even when the value matches the ivar
  // default (0) — it marks the state initialized so the shadow node stops
  // seeding from the app-wide precalculated inset, which may belong to
  // another sheet (e.g. a floating sheet whose real inset is 0).
  if (_didPushBottomInset && _bottomInset == bottomInset) {
    return;
  }
  _bottomInset = bottomInset;
  [self pushBottomInsetState];
}

// Skipped while the keyboard is open — an absolute footer rises above the
// keyboard, so the inset would leave a gap.
- (void)setKeyboardVisible:(BOOL)keyboardVisible {
  if (_keyboardVisible == keyboardVisible) {
    return;
  }
  _keyboardVisible = keyboardVisible;
  [self pushBottomInsetState];
}

- (void)pushBottomInsetState {
  if (!_state) {
    return;
  }

  TrueSheetFooterViewState newState;
  newState.bottomInset = _keyboardVisible ? 0 : _bottomInset;
  newState.initialized = true;
  // Immediate so the inset lands before anything reads the footer's height —
  // the async path races the keyboard caret scroll and detent setup, leaving
  // them an inset stale (same reason Android bridges through
  // TrueSheetStateUpdater).
  _state->updateState(std::move(newState), EventQueue::UpdateMode::unstable_Immediate);
  _didPushBottomInset = YES;
}

// The inset baked into the current layout by the shadow node (pushed or
// seeded — see TrueSheetFooterViewShadowNode). Refreshed in
// updateLayoutMetrics so it always pairs with the measured height.
- (CGFloat)appliedBottomInset {
  return _appliedBottomInset;
}

// Height the footer occupies above the keyboard — its layout height minus the
// safe-area inset it drops while the keyboard is open.
- (CGFloat)keyboardOcclusionHeight {
  return MAX(0, _lastHeight - (_keyboardVisible ? 0 : _bottomInset));
}

#pragma mark - Accessibility

- (NSArray *)accessibilityElements {
  NSMutableArray *elements = [NSMutableArray array];
  [self collectAccessibilityElementsFromView:self into:elements];
  if (elements.count > 0) {
    return elements;
  }

  return [super accessibilityElements];
}

- (void)collectAccessibilityElementsFromView:(UIView *)view into:(NSMutableArray *)elements {
  for (UIView *subview in view.subviews) {
    if (subview.isAccessibilityElement || subview.accessibilityLabel || subview.accessibilityIdentifier) {
      [elements addObject:subview];
    } else if (subview.accessibilityElements.count > 0) {
      [elements addObjectsFromArray:subview.accessibilityElements];
    } else {
      [self collectAccessibilityElementsFromView:subview into:elements];
    }
  }
}

#pragma mark - Layout

- (void)updateLayoutMetrics:(const facebook::react::LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const facebook::react::LayoutMetrics &)oldLayoutMetrics {
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  // State lands before layout metrics within the same mount transaction, so
  // this reflects the inset the shadow node baked into this frame — seeded
  // values are recorded back into the state at layout time (see
  // TrueSheetFooterViewShadowNode).
  CGFloat previousAppliedBottomInset = _appliedBottomInset;
  if (_state) {
    _appliedBottomInset = _state->getData().bottomInset;
  }

  CGFloat height = layoutMetrics.frame.size.height;
  // An inset change alone (fixed-height footer: padding moves, frame doesn't)
  // still changes what's baked in — report so the controller re-pairs.
  if (height != _lastHeight || _appliedBottomInset != previousAppliedBottomInset) {
    _lastHeight = height;
    [self.delegate footerViewDidChangeSize:CGSizeMake(layoutMetrics.frame.size.width, height)];
  }
}

- (void)prepareForRecycle {
  [super prepareForRecycle];

  if (@available(iOS 26.0, *)) {
    [self cleanupEdgeInteraction];
  }

  self.transform = CGAffineTransformIdentity;
  _state = nullptr;
  _lastHeight = 0;
  _currentKeyboardOffset = 0;
  _bottomInset = 0;
  _keyboardVisible = NO;
  _didPushBottomInset = NO;
  _appliedBottomInset = 0;
}

#pragma mark - TrueSheetKeyboardObserverDelegate

// Yoga owns the footer's frame (pinned to the container's bottom edge), so the
// keyboard slide is carried by a transform instead of layout. Only an absolute
// footer floats above the keyboard — a relative footer stays in the layout
// flow behind it.
- (void)keyboardWillShow:(CGFloat)height duration:(NSTimeInterval)duration curve:(UIViewAnimationOptions)curve {
  if (!self.keyboardObserver.viewController.absoluteFooter) {
    return;
  }

  [self setKeyboardVisible:YES];

  CGFloat keyboardOffset = self.keyboardObserver.viewController.footerKeyboardOffset;
  CGFloat slide = MAX(0, height + keyboardOffset);
  _currentKeyboardOffset = slide;

  [UIView animateWithDuration:duration
                        delay:0
                      options:curve | UIViewAnimationOptionBeginFromCurrentState
                   animations:^{
                     self.transform = CGAffineTransformMakeTranslation(0, -slide);
                   }
                   completion:nil];
}

- (void)keyboardWillHide:(NSTimeInterval)duration curve:(UIViewAnimationOptions)curve {
  [self setKeyboardVisible:NO];
  _currentKeyboardOffset = 0;

  [UIView animateWithDuration:duration
                        delay:0
                      options:curve | UIViewAnimationOptionBeginFromCurrentState
                   animations:^{
                     self.transform = CGAffineTransformIdentity;
                   }
                   completion:nil];
}

- (void)applyKeyboardOffset {
  CGFloat height = self.keyboardObserver.currentHeight;
  if (height <= 0 || !self.keyboardObserver.viewController.absoluteFooter) {
    return;
  }

  [self setKeyboardVisible:YES];

  CGFloat keyboardOffset = self.keyboardObserver.viewController.footerKeyboardOffset;
  CGFloat slide = MAX(0, height + keyboardOffset);
  _currentKeyboardOffset = slide;
  self.transform = CGAffineTransformMakeTranslation(0, -slide);
}

@end

Class<RCTComponentViewProtocol> TrueSheetFooterViewCls(void) {
  return TrueSheetFooterView.class;
}

#endif
