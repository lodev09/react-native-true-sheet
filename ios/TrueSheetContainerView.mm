//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "TrueSheetContainerView.h"
#import <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>
#import <react/renderer/components/TrueSheetSpec/RCTComponentViewHelpers.h>
#import <react/renderer/components/TrueSheetSpec/TrueSheetContainerViewComponentDescriptor.h>
#import <react/renderer/components/TrueSheetSpec/TrueSheetContainerViewShadowNode.h>
#import <react/renderer/components/TrueSheetSpec/TrueSheetContainerViewState.h>
#import "TrueSheetContentView.h"
#import "TrueSheetFooterView.h"

#import <React/RCTConversions.h>
#import <React/RCTLog.h>
#import <react/renderer/core/State.h>

using namespace facebook::react;

@interface TrueSheetContainerView () <TrueSheetContentViewDelegate>
@end

@implementation TrueSheetContainerView {
  TrueSheetContentView *_contentView;
  TrueSheetFooterView *_footerView;
  TrueSheetContainerViewShadowNode::ConcreteState::Shared _state;
  CGFloat _lastContainerWidth;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<TrueSheetContainerViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const TrueSheetContainerViewProps>();
    _props = defaultProps;

    self.backgroundColor = [UIColor clearColor];

    _contentView = nil;
    _footerView = nil;
    _lastContainerWidth = 0;
  }
  return self;
}

- (void)layoutSubviews {
  [super layoutSubviews];

  // Override Yoga layout - fill the entire parent (controller's view)
  if (self.superview) {
    CGRect parentBounds = self.superview.bounds;
    if (!CGRectEqualToRect(self.frame, parentBounds)) {
      self.frame = parentBounds;
    }

    // Update state with container width so Yoga can use it for children layout
    [self updateStateIfNeeded];
  }
}

- (void)updateStateIfNeeded {
  if (!self.superview) {
    return;
  }

  CGFloat containerWidth = self.superview.bounds.size.width;
  if (containerWidth > 0 && fabs(containerWidth - _lastContainerWidth) > 0.5) {
    _lastContainerWidth = containerWidth;
    [self updateState];
  }
}

- (void)updateState {
  if (!_state) {
    return;
  }

  _state->updateState([=](TrueSheetContainerViewShadowNode::ConcreteState::Data const &oldData)
                        -> TrueSheetContainerViewShadowNode::ConcreteState::SharedData {
    auto newData = oldData;
    newData.containerWidth = static_cast<float>(_lastContainerWidth);
    return std::make_shared<TrueSheetContainerViewShadowNode::ConcreteState::Data const>(newData);
  });
}

- (CGFloat)contentHeight {
  return _contentView ? _contentView.frame.size.height : 0;
}

- (void)layoutFooter {
  if (_footerView) {
    // Force footer to reapply constraints on size change
    CGFloat height = _footerView.frame.size.height;
    if (height > 0) {
      [_footerView setupConstraintsWithHeight:height];
    }
  }
}

- (void)setupContentScrollViewPinning:(BOOL)pinned {
  if (_contentView) {
    [_contentView setupScrollViewPinning:pinned];
  }
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [super mountChildComponentView:childComponentView index:index];

  // Handle content view mounting
  if ([childComponentView isKindOfClass:[TrueSheetContentView class]]) {
    if (_contentView != nil) {
      RCTLogWarn(@"TrueSheet: Container can only have one content component.");
      return;
    }

    _contentView = (TrueSheetContentView *)childComponentView;
    _contentView.delegate = self;
  }

  // Handle footer view mounting
  if ([childComponentView isKindOfClass:[TrueSheetFooterView class]]) {
    if (_footerView != nil) {
      RCTLogWarn(@"TrueSheet: Container can only have one footer component.");
      return;
    }

    _footerView = (TrueSheetFooterView *)childComponentView;
  }
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  if ([childComponentView isKindOfClass:[TrueSheetContentView class]]) {
    _contentView = nil;
  }

  if ([childComponentView isKindOfClass:[TrueSheetFooterView class]]) {
    _footerView = nil;
  }

  [super unmountChildComponentView:childComponentView index:index];
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps {
  [super updateProps:props oldProps:oldProps];
}

- (void)updateState:(const State::Shared &)state oldState:(const State::Shared &)oldState {
  _state = std::static_pointer_cast<TrueSheetContainerViewShadowNode::ConcreteState const>(state);

  // Reset last width when state is updated to ensure we push the correct width
  // This handles re-presentation of the sheet where state is recreated
  _lastContainerWidth = 0;
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask {
  [super finalizeUpdates:updateMask];
  [self updateStateIfNeeded];
}

#pragma mark - TrueSheetContentViewDelegate

- (void)contentViewDidChangeSize:(CGSize)newSize {
  // Forward content size changes to host view for sheet resizing
  if ([self.delegate respondsToSelector:@selector(containerViewContentDidChangeSize:)]) {
    [self.delegate containerViewContentDidChangeSize:newSize];
  }
}

@end

#endif
