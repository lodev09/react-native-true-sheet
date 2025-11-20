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

using namespace facebook::react;

@implementation TrueSheetFooterView {
  RCTSurfaceTouchHandler *_touchHandler;
  CGFloat _lastHeight;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<TrueSheetFooterViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const TrueSheetFooterViewProps>();
    _props = defaultProps;

    // Set background color to clear by default
    self.backgroundColor = [UIColor clearColor];

    // Create touch handler for React Native touch events
    _touchHandler = [[RCTSurfaceTouchHandler alloc] init];
    [_touchHandler attachToView:self];

    _lastHeight = 0;
  }
  return self;
}

- (void)setupConstraintsWithHeight:(CGFloat)height {
  // Get parent view (container)
  UIView *parentView = self.superview;
  if (!parentView) {
    return;
  }

  // Unpin existing constraints first
  [LayoutUtil unpinView:self];

  // Pin to bottom, leading, and trailing edges with height constraint
  // Pin to container (parent) which already fills the controller's view
  [LayoutUtil pinView:self
         toParentView:parentView
                edges:UIRectEdgeLeft | UIRectEdgeRight | UIRectEdgeBottom
               height:height];

  // Update cached height
  _lastHeight = height;
}

- (void)setup {
  // Setup initial constraints with current frame height
  CGFloat initialHeight = self.frame.size.height;
  [self setupConstraintsWithHeight:initialHeight];
}

- (void)updateLayoutMetrics:(const facebook::react::LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const facebook::react::LayoutMetrics &)oldLayoutMetrics {
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  // Get the height from layout metrics
  CGFloat height = layoutMetrics.frame.size.height;

  // Only update constraints if height has changed
  if (height != _lastHeight) {
    [self setupConstraintsWithHeight:height];
  }
}

- (void)cleanup {
  // Detach touch handler
  if (_touchHandler) {
    [_touchHandler detachFromView:self];
    _touchHandler = nil;
  }

  // Unpin constraints (view removal handled by React Native)
  [LayoutUtil unpinView:self];

  _lastHeight = 0;
}

@end

#endif
