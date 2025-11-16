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
#import "utils/LayoutUtil.h"
#import "TrueSheetView.h"
#import "TrueSheetViewController.h"

using namespace facebook::react;

@implementation TrueSheetFooterView {
  RCTSurfaceTouchHandler *_touchHandler;
  __weak TrueSheetView *_sheetView;
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
    _sheetView = nil;
    _lastHeight = 0;
  }
  return self;
}

- (void)setupConstraintsWithHeight:(CGFloat)height {
  if (!_sheetView) {
    return;
  }

  // Get parent view
  UIView *parentView = _sheetView.controller.view;

  // Unpin existing constraints first
  [LayoutUtil unpinView:self];

  // Pin to bottom, leading, and trailing edges with height constraint
  [LayoutUtil pinView:self
         toParentView:parentView
                edges:UIRectEdgeLeft | UIRectEdgeRight | UIRectEdgeBottom
                         height:height];

  // Update cached height
  _lastHeight = height;
}

- (void)setupInSheetView:(TrueSheetView *)sheetView {
  // Store reference to sheet view
  _sheetView = sheetView;

  // Get the controller's view as the parent view
  UIView *parentView = sheetView.controller.view;

  // Add to parent view hierarchy
  [parentView addSubview:self];

  // Setup initial constraints with current frame height
  CGFloat initialHeight = self.frame.size.height;
  [self setupConstraintsWithHeight:initialHeight];

  // Ensure footer is above container
  [parentView bringSubviewToFront:self];

  // Attach touch handler for React Native touch events
  if (_touchHandler) {
    [_touchHandler attachToView:self];
  }
}

- (void)updateLayoutMetrics:(const facebook::react::LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const facebook::react::LayoutMetrics &)oldLayoutMetrics {
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  // Only update constraints if the view has been added to sheet view
  if (!_sheetView) {
    return;
  }

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
  }

  // Unpin and remove from view hierarchy
  [LayoutUtil unpinView:self];
  [self removeFromSuperview];

  // Clear reference to sheet view
  _sheetView = nil;
  _lastHeight = 0;
}

@end

#endif
