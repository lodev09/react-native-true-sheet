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

    _lastHeight = 0;
  }
  return self;
}

- (void)setupConstraintsWithHeight:(CGFloat)height {
  UIView *parentView = self.superview;
  if (!parentView) {
    return;
  }

  // Remove existing constraints before applying new ones
  [LayoutUtil unpinView:self];

  // Pin footer to bottom and sides of container with specific height
  [LayoutUtil pinView:self
         toParentView:parentView
                edges:UIRectEdgeLeft | UIRectEdgeRight | UIRectEdgeBottom
               height:height];

  _lastHeight = height;
}

- (void)didMoveToSuperview {
  [super didMoveToSuperview];
  
  // Setup footer constraints when added to container
  if (self.superview) {
    CGFloat initialHeight = self.frame.size.height;
    [self setupConstraintsWithHeight:initialHeight];
  }
}

- (void)updateLayoutMetrics:(const facebook::react::LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const facebook::react::LayoutMetrics &)oldLayoutMetrics {
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  CGFloat height = layoutMetrics.frame.size.height;

  // Update footer constraints when height changes
  if (height != _lastHeight) {
    [self setupConstraintsWithHeight:height];
  }
}

- (void)prepareForRecycle {
  [super prepareForRecycle];
  
  // Remove footer constraints
  [LayoutUtil unpinView:self];

  _lastHeight = 0;
}

@end

#endif
