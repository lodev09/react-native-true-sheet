//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "TrueSheetOverlayView.h"
#import "core/TrueSheetOverlayContainerView.h"

#import <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>
#import <react/renderer/components/TrueSheetSpec/RCTComponentViewHelpers.h>
#import <react/renderer/components/TrueSheetSpec/TrueSheetOverlayViewComponentDescriptor.h>
#import <react/renderer/components/TrueSheetSpec/TrueSheetOverlayViewShadowNode.h>

#import <React/RCTSurfaceTouchHandler.h>

using namespace facebook::react;

static NSHashTable<TrueSheetOverlayView *> *gOverlayViews;

@interface TrueSheetOverlayView () <TrueSheetOverlayContainerViewDelegate>
@end

@implementation TrueSheetOverlayView {
  TrueSheetOverlayContainerView *_containerView;
  RCTSurfaceTouchHandler *_touchHandler;
  TrueSheetOverlayViewShadowNode::ConcreteState::Shared _state;
  CGSize _lastStateSize;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<TrueSheetOverlayViewComponentDescriptor>();
}

+ (void)bringOverlaysToFrontInWindow:(nullable UIWindow *)window {
  if (!window)
    return;

  for (TrueSheetOverlayView *overlay in gOverlayViews) {
    if (overlay->_containerView.superview == window) {
      [window bringSubviewToFront:overlay->_containerView];
    }
  }
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const TrueSheetOverlayViewProps>();
    _props = defaultProps;

    _containerView = [[TrueSheetOverlayContainerView alloc] initWithFrame:CGRectZero];
    _containerView.delegate = self;

    _touchHandler = [[RCTSurfaceTouchHandler alloc] init];
    [_touchHandler attachToView:_containerView];

    _lastStateSize = CGSizeZero;

    // The host stays in the React tree for layout only — children render in the container
    self.hidden = YES;

    if (!gOverlayViews) {
      gOverlayViews = [NSHashTable weakObjectsHashTable];
    }
    [gOverlayViews addObject:self];
  }
  return self;
}

- (void)didMoveToWindow {
  [super didMoveToWindow];

  UIWindow *window = self.window;
  if (window) {
    _containerView.frame = window.bounds;
    [window addSubview:_containerView];
  } else {
    [_containerView removeFromSuperview];
  }
}

#pragma mark - State

- (void)updateState:(const State::Shared &)state oldState:(const State::Shared &)oldState {
  _state = std::static_pointer_cast<TrueSheetOverlayViewShadowNode::ConcreteState const>(state);

  if (self.window) {
    [self updateStateWithSize:self.window.bounds.size];
  }
}

- (void)overlayContainerViewDidLayout:(CGSize)size {
  [self updateStateWithSize:size];
}

- (void)updateStateWithSize:(CGSize)size {
  if (!_state)
    return;

  if (fabs(size.width - _lastStateSize.width) < 0.5 && fabs(size.height - _lastStateSize.height) < 0.5)
    return;

  _lastStateSize = size;

  auto stateData = _state->getData();
  stateData.containerWidth = static_cast<float>(size.width);
  stateData.containerHeight = static_cast<float>(size.height);
  _state->updateState(std::move(stateData), EventQueue::UpdateMode::unstable_Immediate);
}

#pragma mark - Child Component Mounting

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [_containerView insertSubview:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [childComponentView removeFromSuperview];
}

- (void)prepareForRecycle {
  [super prepareForRecycle];

  [_containerView removeFromSuperview];
  _lastStateSize = CGSizeZero;
  _state.reset();
  self.hidden = YES;
}

@end

Class<RCTComponentViewProtocol> TrueSheetOverlayViewCls(void) {
  return TrueSheetOverlayView.class;
}

#endif
