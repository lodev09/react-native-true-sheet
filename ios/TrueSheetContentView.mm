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
#import "TrueSheetView.h"
#import "TrueSheetViewController.h"
#import "utils/LayoutUtil.h"

using namespace facebook::react;

@implementation TrueSheetContentView {
  RCTScrollViewComponentView *_pinnedScrollView;
  UIView *_pinnedTopView;
  CGSize _lastSize;
  UIEdgeInsets _contentInsets;
  UIEdgeInsets _pinnedInsets;
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
    _contentInsets = UIEdgeInsetsZero;
    _pinnedInsets = UIEdgeInsetsZero;
  }
  return self;
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics {
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  // Store content insets (padding + border) for scroll view pinning
  UIEdgeInsets newInsets = UIEdgeInsetsMake(
      layoutMetrics.contentInsets.top,
      layoutMetrics.contentInsets.left,
      layoutMetrics.contentInsets.bottom,
      layoutMetrics.contentInsets.right);

  if (!UIEdgeInsetsEqualToEdgeInsets(newInsets, _contentInsets)) {
    _contentInsets = newInsets;
    if ([self.delegate respondsToSelector:@selector(contentViewDidChangeInsets)]) {
      [self.delegate contentViewDidChangeInsets];
    }
  }

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

- (void)setupScrollViewPinning:(BOOL)pinned {
  // Pin left/right to content view (self) to respect margin/padding from style
  // Pin bottom to container view for proper scrolling behavior
  UIView *containerView = self.superview;

  if (!pinned) {
    [self unpinScrollViewFromParentView:self];
    [self unpinScrollViewFromParentView:containerView];
    _pinnedScrollView = nil;
    _pinnedTopView = nil;
    _pinnedInsets = UIEdgeInsetsZero;
    return;
  }

  // Auto-detect and pin scroll views for proper sheet scrolling behavior
  // Pinning ensures ScrollView fills the available area and scrolls correctly with the sheet
  UIView *topSibling = nil;
  RCTScrollViewComponentView *scrollView = [self findScrollView:&topSibling];

  // Use closest top sibling (view above ScrollView) if found
  UIView *topView = topSibling;

  // Re-pin when scroll view, top view, or insets change
  BOOL scrollViewChanged = scrollView != _pinnedScrollView;
  BOOL topViewChanged = topView != _pinnedTopView;
  BOOL insetsChanged = !UIEdgeInsetsEqualToEdgeInsets(_contentInsets, _pinnedInsets);

  if (scrollView && containerView && (scrollViewChanged || topViewChanged || insetsChanged)) {
    // Unpin first to remove old constraints
    [self unpinScrollViewFromParentView:self];
    [self unpinScrollViewFromParentView:containerView];

    scrollView.translatesAutoresizingMaskIntoConstraints = NO;

    // Pin left/right to content view with padding insets
    [scrollView.leadingAnchor constraintEqualToAnchor:self.leadingAnchor constant:_contentInsets.left].active = YES;
    [scrollView.trailingAnchor constraintEqualToAnchor:self.trailingAnchor constant:-_contentInsets.right].active = YES;

    // Pin top to topView (sibling above ScrollView) if available, otherwise to content view
    if (topView) {
      [scrollView.topAnchor constraintEqualToAnchor:topView.bottomAnchor].active = YES;
    } else {
      [scrollView.topAnchor constraintEqualToAnchor:self.topAnchor constant:_contentInsets.top].active = YES;
    }

    // Pin bottom to container view for proper scrolling
    [scrollView.bottomAnchor constraintEqualToAnchor:containerView.bottomAnchor].active = YES;

    _pinnedScrollView = scrollView;
    _pinnedTopView = topView;
    _pinnedInsets = _contentInsets;
  } else if (!scrollView && _pinnedScrollView) {
    // ScrollView was removed, clean up
    [self unpinScrollViewFromParentView:self];
    [self unpinScrollViewFromParentView:containerView];
    _pinnedScrollView = nil;
    _pinnedTopView = nil;
    _pinnedInsets = UIEdgeInsetsZero;
  }
}

- (RCTScrollViewComponentView *)findScrollViewInSubviews:(NSArray<UIView *> *)subviews {
  for (UIView *subview in subviews) {
    if ([subview isKindOfClass:TrueSheetView.class]) {
      continue;
    }
    if ([subview isKindOfClass:RCTScrollViewComponentView.class]) {
      return (RCTScrollViewComponentView *)subview;
    }
  }
  return nil;
}

- (RCTScrollViewComponentView *)findScrollView:(UIView **)outTopSibling {
  if (self.subviews.count == 0) {
    return nil;
  }

  UIView *topSibling = nil;

  // Check first-level children for scroll views (ScrollView or FlatList)
  RCTScrollViewComponentView *scrollView = [self findScrollViewInSubviews:self.subviews];

  // If not found, check second level (grandchildren)
  if (!scrollView) {
    for (UIView *subview in self.subviews) {
      scrollView = [self findScrollViewInSubviews:subview.subviews];
      if (scrollView) {
        break;
      }
    }
  }

  // Find the view positioned directly above the ScrollView (only for first-level)
  if (scrollView && scrollView.superview == self && self.subviews.count > 1) {
    CGFloat scrollViewTop = CGRectGetMinY(scrollView.frame);
    CGFloat closestDistance = CGFLOAT_MAX;

    for (UIView *sibling in self.subviews) {
      if (sibling == scrollView || [sibling isKindOfClass:TrueSheetView.class]) {
        continue;
      }

      CGFloat siblingBottom = CGRectGetMaxY(sibling.frame);
      if (siblingBottom <= scrollViewTop) {
        CGFloat distance = scrollViewTop - siblingBottom;
        if (distance < closestDistance) {
          closestDistance = distance;
          topSibling = sibling;
        }
      }
    }
  }

  if (outTopSibling) {
    *outTopSibling = topSibling;
  }

  return scrollView;
}

- (void)prepareForRecycle {
  [super prepareForRecycle];

  // Remove scroll view constraints from both content and container views
  if (_pinnedScrollView) {
    [LayoutUtil unpinView:_pinnedScrollView fromParentView:self];
    [LayoutUtil unpinView:_pinnedScrollView fromParentView:self.superview];
    _pinnedScrollView = nil;
    _pinnedTopView = nil;
    _pinnedInsets = UIEdgeInsetsZero;
  }
}

@end

Class<RCTComponentViewProtocol> TrueSheetContentViewCls(void) {
  return TrueSheetContentView.class;
}

#endif
