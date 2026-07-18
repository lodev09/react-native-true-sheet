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
  if (_bottomInset == bottomInset) {
    return;
  }
  _bottomInset = bottomInset;

  if (_state) {
    TrueSheetFooterViewState newState;
    newState.bottomInset = bottomInset;
    _state->updateState(std::move(newState));
  }
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

  CGFloat height = layoutMetrics.frame.size.height;
  if (height != _lastHeight) {
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
}

#pragma mark - TrueSheetKeyboardObserverDelegate

// Yoga owns the footer's frame (pinned to the container's bottom edge), so the
// keyboard slide is carried by a transform instead of layout.
- (void)keyboardWillShow:(CGFloat)height duration:(NSTimeInterval)duration curve:(UIViewAnimationOptions)curve {
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
  if (height <= 0) {
    return;
  }

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
