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
#import <react/renderer/components/TrueSheetSpec/ComponentDescriptors.h>
#import <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>
#import <react/renderer/components/TrueSheetSpec/RCTComponentViewHelpers.h>
#import "TrueSheetViewController.h"
#import "utils/LayoutUtil.h"

using namespace facebook::react;

@implementation TrueSheetContentView {
  RCTScrollViewComponentView *_pinnedScrollView;
  UIView *_pinnedTopView;
  CGSize _lastSize;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<TrueSheetContentViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const TrueSheetContentViewProps>();
    _props = defaultProps;

    _pinnedScrollView = nil;
    _pinnedTopView = nil;
    _lastSize = CGSizeZero;
  }
  return self;
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics {
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  // Notify delegate when content size changes for sheet height updates
  CGSize newSize = CGSizeMake(layoutMetrics.frame.size.width, layoutMetrics.frame.size.height);
  if (!CGSizeEqualToSize(newSize, _lastSize)) {
    _lastSize = newSize;
    if ([self.delegate respondsToSelector:@selector(contentViewDidChangeSize:)]) {
      [self.delegate contentViewDidChangeSize:newSize];
    }
  }
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [super mountChildComponentView:childComponentView index:index];

  if ([self.delegate respondsToSelector:@selector(contentViewDidChangeChildren)]) {
    [self.delegate contentViewDidChangeChildren];
  }
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [super unmountChildComponentView:childComponentView index:index];

  if ([self.delegate respondsToSelector:@selector(contentViewDidChangeChildren)]) {
    [self.delegate contentViewDidChangeChildren];
  }
}

- (void)unpinScrollViewFromParentView:(UIView *)parentView {
  // Unpin previous scroll view if exists
  if (_pinnedScrollView) {
    [LayoutUtil unpinView:_pinnedScrollView fromParentView:parentView];
  }
}

- (void)setupScrollViewPinning:(BOOL)pinned withHeaderView:(UIView *)headerView {
  // Pin to container view (parent of content view)
  UIView *containerView = self.superview;

  if (!pinned) {
    [self unpinScrollViewFromParentView:containerView];
    _pinnedScrollView = nil;
    _pinnedTopView = nil;
    return;
  }

  // Auto-detect and pin scroll views for proper sheet scrolling behavior
  // Pinning ensures ScrollView fills the available area and scrolls correctly with the sheet
  UIView *topSibling = nil;
  RCTScrollViewComponentView *scrollView = [self findScrollView:&topSibling];

  // Use closest top sibling if found, otherwise fall back to header view
  UIView *topView = topSibling ?: headerView;

  // Re-pin when scroll view or top view changes
  BOOL scrollViewChanged = scrollView != _pinnedScrollView;
  BOOL topViewChanged = topView != _pinnedTopView;

  if (scrollView && containerView && (scrollViewChanged || topViewChanged)) {
    // Unpin first to remove old constraints
    [self unpinScrollViewFromParentView:containerView];

    if (topView) {
      // Pin ScrollView below the top view
      [LayoutUtil pinView:scrollView
             toParentView:containerView
              withTopView:topView
                    edges:UIRectEdgeLeft | UIRectEdgeRight | UIRectEdgeBottom];
    } else {
      // No top view, pin to all edges of container
      [LayoutUtil pinView:scrollView toParentView:containerView edges:UIRectEdgeAll];
    }

    _pinnedScrollView = scrollView;
    _pinnedTopView = topView;
  } else if (!scrollView && _pinnedScrollView) {
    // ScrollView was removed, clean up
    [self unpinScrollViewFromParentView:containerView];
    _pinnedScrollView = nil;
    _pinnedTopView = nil;
  }
}

- (RCTScrollViewComponentView *)findScrollView:(UIView **)outTopSibling {
  if (self.subviews.count == 0) {
    return nil;
  }

  RCTScrollViewComponentView *scrollView = nil;
  UIView *topSibling = nil;

  // Check first-level children for scroll views (ScrollView or FlatList)
  for (UIView *subview in self.subviews) {
    if ([subview isKindOfClass:RCTScrollViewComponentView.class]) {
      scrollView = (RCTScrollViewComponentView *)subview;

      // Find the view positioned directly above this ScrollView by frame position
      if (self.subviews.count > 1) {
        CGFloat scrollViewTop = CGRectGetMinY(scrollView.frame);
        CGFloat closestDistance = CGFLOAT_MAX;

        for (UIView *sibling in self.subviews) {
          // Skip the ScrollView itself
          if (sibling == scrollView) {
            continue;
          }

          CGFloat siblingBottom = CGRectGetMaxY(sibling.frame);

          // Check if this sibling is positioned above the ScrollView
          if (siblingBottom <= scrollViewTop) {
            CGFloat distance = scrollViewTop - siblingBottom;

            // Find the closest view above (smallest distance)
            if (distance < closestDistance) {
              closestDistance = distance;
              topSibling = sibling;
            }
          }
        }
      }

      break;  // Found ScrollView, no need to continue
    }
  }

  if (outTopSibling) {
    *outTopSibling = topSibling;
  }

  return scrollView;
}

- (void)prepareForRecycle {
  [super prepareForRecycle];

  // Remove scroll view constraints
  if (_pinnedScrollView) {
    [LayoutUtil unpinView:_pinnedScrollView fromParentView:self.superview];
    _pinnedScrollView = nil;
    _pinnedTopView = nil;
  }
}

@end

#endif
