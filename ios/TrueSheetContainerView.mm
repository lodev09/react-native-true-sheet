//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "TrueSheetContainerView.h"
#import "TrueSheetLayoutUtils.h"
#import <react/renderer/components/TrueSheetSpec/ComponentDescriptors.h>
#import <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>
#import <react/renderer/components/TrueSheetSpec/RCTComponentViewHelpers.h>

using namespace facebook::react;

@implementation TrueSheetContainerView {
  LayoutMetrics _layoutMetrics;
  RCTSurfaceTouchHandler *_touchHandler;
  UIView *_pinnedScrollView;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<TrueSheetContainerViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const TrueSheetContainerViewProps>();
    _props = defaultProps;
    
    // Create touch handler for React Native touch events
    _touchHandler = [[RCTSurfaceTouchHandler alloc] init];
    _pinnedScrollView = nil;
  }
  return self;
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
  oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics {
  _layoutMetrics = layoutMetrics;
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];
}

- (void)setupInParentView:(UIView *)parentView {
  // Add to parent view hierarchy
  [parentView addSubview:self];
  
  // Auto-detect and pin scroll views to enable proper scrolling behavior
  // This happens immediately instead of waiting for didMoveToWindow to ensure the view hierarchy is ready
  [self setupScrollViewPinning:parentView];
  
  // Ensure container is above background view for touch events
  [parentView bringSubviewToFront:self];
  
  // Attach touch handler for React Native touch events
  if (_touchHandler) {
    [_touchHandler attachToView:self];
  }
}

- (void)setupScrollViewPinning:(UIView *)parentView {
  // Find scroll view in content view hierarchy
  UIView *scrollView = [self findScrollView];
  
  if (scrollView && scrollView != _pinnedScrollView) {
    // Unpin previous scroll view if exists
    if (_pinnedScrollView) {
   [TrueSheetLayoutUtils unpinView:_pinnedScrollView];
    }
    
    // Pin the scroll view directly to the sheet controller's view instead of its immediate parent
    // This ensures the scroll view fills the entire sheet area for proper scrolling behavior
    [TrueSheetLayoutUtils pinView:scrollView toParentView:parentView edges:UIRectEdgeAll];
    _pinnedScrollView = scrollView;
  }
}

- (UIView *)findScrollView {
  // Get the first child - this is the React component's root view
  if (self.subviews.count == 0) {
    return nil;
  }
  
  UIView *contentView = self.subviews[0];
  
  // Check first-level children only (non-recursive) for scroll views
  // This covers common cases like <ScrollView> or <FlatList> as direct children
  for (UIView *subview in contentView.subviews) {
    if ([subview isKindOfClass:[UIScrollView class]]) {
   return subview;
    }
  }
  
  return nil;
}

- (void)cleanup {
  // Detach touch handler
  if (_touchHandler) {
    [_touchHandler detachFromView:self];
  }
  
  // Unpin scroll view if exists
  if (_pinnedScrollView) {
    [TrueSheetLayoutUtils unpinView:_pinnedScrollView];
    _pinnedScrollView = nil;
  }
  
  // Unpin and remove from view hierarchy
  [TrueSheetLayoutUtils unpinView:self];
  [self removeFromSuperview];
}

@end

#endif
