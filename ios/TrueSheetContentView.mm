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

//- (void)didMoveToSuperview {
//  [super didMoveToSuperview];
//
//  // Setup scroll view pinning after Fabric mounts the view in container
//  // Ensures proper view hierarchy for scroll detection and pinning
//  if (self.superview) {
//    NSLog(@"content has attached");
////    [self setupScrollViewPinning];
//  }
//}

- (void)unpinScrollView {
  // Unpin previous scroll view if exists
  if (_pinnedScrollView) {
    [LayoutUtil unpinView:_pinnedScrollView];
  }
}

- (void)setupScrollViewPinning:(BOOL)pinned {
  if (!pinned) {
    [self unpinScrollView];
    return;
  }

  // Auto-detect and pin scroll views for proper sheet scrolling behavior
  // Pinning ensures ScrollView fills the sheet area and scrolls correctly with the sheet
  UIView *topSibling = nil;
  RCTScrollViewComponentView *scrollView = [self findScrollView:&topSibling];

  if (scrollView && scrollView != _pinnedScrollView) {
    [self unpinScrollView];

    // Pin to container view to enable proper scrolling within the sheet
    UIView *containerView = self.superview;
    if (containerView) {
      if (topSibling) {
        // Pin ScrollView below the top sibling
        [LayoutUtil pinView:scrollView
               toParentView:containerView
                withTopView:topSibling
                      edges:UIRectEdgeLeft | UIRectEdgeRight | UIRectEdgeBottom];
      } else {
        // No top sibling, pin to all edges of container (original behavior)
        [LayoutUtil pinView:scrollView toParentView:containerView edges:UIRectEdgeAll];
      }

      _pinnedScrollView = scrollView;
    }
  }
}

- (RCTScrollViewComponentView *)findScrollView {
  return [self findScrollView:nil];
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
      scrollView = static_cast<RCTScrollViewComponentView *>(subview);

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
    [LayoutUtil unpinView:_pinnedScrollView];
    _pinnedScrollView = nil;
  }
}

@end

#endif
