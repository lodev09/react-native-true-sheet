//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "TrueSheetContentView.h"
#import <react/renderer/components/TrueSheetSpec/ComponentDescriptors.h>
#import <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>
#import <react/renderer/components/TrueSheetSpec/RCTComponentViewHelpers.h>
#import <React/RCTScrollViewComponentView.h>
#import "TrueSheetViewController.h"
#import "utils/LayoutUtil.h"

using namespace facebook::react;

@implementation TrueSheetContentView {
  RCTSurfaceTouchHandler *_touchHandler;
  RCTScrollViewComponentView *_pinnedScrollView;
  CGSize _lastSize;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<TrueSheetContentViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const TrueSheetContentViewProps>();
    _props = defaultProps;

    // Create touch handler for React Native touch events
    _touchHandler = [[RCTSurfaceTouchHandler alloc] init];
    _pinnedScrollView = nil;
    _lastSize = CGSizeZero;
  }
  return self;
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics {
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  // Notify delegate when size changes
  CGSize newSize = CGSizeMake(layoutMetrics.frame.size.width, layoutMetrics.frame.size.height);
  if (!CGSizeEqualToSize(newSize, _lastSize)) {
    _lastSize = newSize;
    if ([self.delegate respondsToSelector:@selector(contentViewDidChangeSize:)]) {
      [self.delegate contentViewDidChangeSize:newSize];
    }
  }
}

- (void)setupWithController:(TrueSheetViewController *)controller {
  // Attach touch handler for React Native touch events
  if (_touchHandler) {
    [_touchHandler attachToView:self];
  }

  // Auto-detect and pin scroll views to container for proper scrolling behavior
  [self setupScrollViewPinning];
}

- (void)setupScrollViewPinning {
  // Find scroll view in content view hierarchy
  RCTScrollViewComponentView *scrollView = [self findScrollView];

  if (scrollView && scrollView != _pinnedScrollView) {
    // Unpin previous scroll view if exists
    if (_pinnedScrollView) {
      [LayoutUtil unpinView:_pinnedScrollView];
    }

    // Get container view (self.superview)
    UIView *containerView = self.superview;
    if (containerView) {
      // Pin the scroll view to the container view
      // This ensures the scroll view fills the entire sheet area for proper scrolling behavior
      [LayoutUtil pinView:scrollView toParentView:containerView edges:UIRectEdgeAll];
      _pinnedScrollView = scrollView;
    }
  }
}

- (RCTScrollViewComponentView *)findScrollView {
  // Get the first child - this is the React component's root view
  if (self.subviews.count == 0) {
    return nil;
  }

  UIView *contentView = self.subviews[0];

  // Check first-level children only (non-recursive) for scroll views
  // This covers common cases like <ScrollView> or <FlatList> as direct children
  for (UIView *subview in contentView.subviews) {
    if ([subview isKindOfClass:RCTScrollViewComponentView.class]) {
      return static_cast<RCTScrollViewComponentView *>(subview);
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
    [LayoutUtil unpinView:_pinnedScrollView];
    _pinnedScrollView = nil;
  }

  // Note: View removal is handled by React Native
}

@end

#endif
