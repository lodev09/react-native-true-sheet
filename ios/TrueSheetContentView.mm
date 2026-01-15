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
  }
  return self;
}

#pragma mark - Layout

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics {
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  UIEdgeInsets newInsets = UIEdgeInsetsMake(
      layoutMetrics.contentInsets.top,
      layoutMetrics.contentInsets.left,
      layoutMetrics.contentInsets.bottom,
      layoutMetrics.contentInsets.right);

  if (!UIEdgeInsetsEqualToEdgeInsets(newInsets, _contentInsets)) {
    _contentInsets = newInsets;
    [self.delegate contentViewDidChangeInsets];
  }

  CGSize newSize = CGSizeMake(layoutMetrics.frame.size.width, layoutMetrics.frame.size.height);
  if (!CGSizeEqualToSize(newSize, _lastSize)) {
    _lastSize = newSize;
    [self.delegate contentViewDidChangeSize:newSize];
  }
}

#pragma mark - Child Mounting

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [super mountChildComponentView:childComponentView index:index];
  [self.delegate contentViewDidChangeChildren];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [super unmountChildComponentView:childComponentView index:index];
  [self.delegate contentViewDidChangeChildren];
}

#pragma mark - ScrollView Pinning

- (void)clearPinning {
  if (_pinnedScrollView) {
    [LayoutUtil unpinView:_pinnedScrollView fromParentView:self];
    [LayoutUtil unpinView:_pinnedScrollView fromParentView:self.superview];
  }
  _pinnedScrollView = nil;
  _pinnedTopView = nil;
  _pinnedInsets = UIEdgeInsetsZero;
}

- (void)setupScrollViewPinning:(BOOL)pinned {
  UIView *containerView = self.superview;

  if (!pinned) {
    [self clearPinning];
    return;
  }

  UIView *topSibling = nil;
  RCTScrollViewComponentView *scrollView = [self findScrollView:&topSibling];

  BOOL needsUpdate = scrollView != _pinnedScrollView ||
                     topSibling != _pinnedTopView ||
                     !UIEdgeInsetsEqualToEdgeInsets(_contentInsets, _pinnedInsets);

  if (scrollView && containerView && needsUpdate) {
    [self clearPinning];

    UIEdgeInsets insets = UIEdgeInsetsMake(
        topSibling ? 0 : _contentInsets.top,
        _contentInsets.left,
        0,
        _contentInsets.right);

    if (topSibling) {
      [LayoutUtil pinView:scrollView toParentView:self withTopView:topSibling edges:UIRectEdgeLeft | UIRectEdgeRight insets:insets];
    } else {
      [LayoutUtil pinView:scrollView toParentView:self edges:UIRectEdgeTop | UIRectEdgeLeft | UIRectEdgeRight insets:insets];
    }

    [LayoutUtil pinView:scrollView toParentView:containerView edges:UIRectEdgeBottom];

    _pinnedScrollView = scrollView;
    _pinnedTopView = topSibling;
    _pinnedInsets = _contentInsets;
  } else if (!scrollView && _pinnedScrollView) {
    [self clearPinning];
  }
}

- (RCTScrollViewComponentView *)findScrollView:(UIView **)outTopSibling {
  if (self.subviews.count == 0) {
    return nil;
  }

  RCTScrollViewComponentView *scrollView = [self findScrollViewInSubviews:self.subviews];

  if (!scrollView) {
    for (UIView *subview in self.subviews) {
      scrollView = [self findScrollViewInSubviews:subview.subviews];
      if (scrollView) {
        break;
      }
    }
  }

  if (outTopSibling) {
    *outTopSibling = [self findTopSiblingForScrollView:scrollView];
  }

  return scrollView;
}

- (RCTScrollViewComponentView *)findScrollViewInSubviews:(NSArray<UIView *> *)subviews {
  for (UIView *subview in subviews) {
    if ([subview isKindOfClass:RCTScrollViewComponentView.class] &&
        ![subview isKindOfClass:TrueSheetView.class]) {
      return (RCTScrollViewComponentView *)subview;
    }
  }
  return nil;
}

- (UIView *)findTopSiblingForScrollView:(RCTScrollViewComponentView *)scrollView {
  if (!scrollView || scrollView.superview != self || self.subviews.count <= 1) {
    return nil;
  }

  CGFloat scrollViewTop = CGRectGetMinY(scrollView.frame);
  UIView *topSibling = nil;
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

  return topSibling;
}

#pragma mark - Lifecycle

- (void)prepareForRecycle {
  [super prepareForRecycle];
  [self clearPinning];
}

@end

Class<RCTComponentViewProtocol> TrueSheetContentViewCls(void) {
  return TrueSheetContentView.class;
}

#endif
