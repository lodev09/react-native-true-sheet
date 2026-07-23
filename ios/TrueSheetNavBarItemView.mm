//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "TrueSheetNavBarItemView.h"

#import <react/renderer/components/TrueSheetSpec/ComponentDescriptors.h>
#import <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>
#import <react/renderer/components/TrueSheetSpec/RCTComponentViewHelpers.h>

using namespace facebook::react;

@implementation TrueSheetNavBarItemView {
  CGSize _lastSize;
  // Strong reference creates a retain cycle through the custom view —
  // cleared in prepareForRecycle
  UIBarButtonItem *_barButtonItem;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<TrueSheetNavBarItemViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const TrueSheetNavBarItemViewProps>();
    _props = defaultProps;

    _lastSize = CGSizeZero;
    _slotType = TrueSheetNavBarItemViewSlotType::Left;
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps {
  [super updateProps:props oldProps:oldProps];

  const auto &newProps = *std::static_pointer_cast<TrueSheetNavBarItemViewProps const>(props);
  _slotType = newProps.slotType;
}

- (void)updateLayoutMetrics:(const facebook::react::LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const facebook::react::LayoutMetrics &)oldLayoutMetrics {
  if (self.needsAutoLayout) {
    // Auto Layout owns the frame — record Yoga's metrics and surface the size
    // via intrinsicContentSize instead of applying it directly
    _layoutMetrics = layoutMetrics;
  } else {
    // UIKit owns this view's position inside the bar — apply Yoga's size only,
    // otherwise the frame origin (relative to the config view) would offset it.
    auto adjustedMetrics = layoutMetrics;
    adjustedMetrics.frame.origin = {0, 0};
    [super updateLayoutMetrics:adjustedMetrics oldLayoutMetrics:oldLayoutMetrics];
  }

  CGSize newSize = CGSizeMake(layoutMetrics.frame.size.width, layoutMetrics.frame.size.height);
  if (!CGSizeEqualToSize(newSize, _lastSize)) {
    _lastSize = newSize;
    [self invalidateIntrinsicContentSize];

    if ([self.delegate respondsToSelector:@selector(navBarItemViewDidChangeSize:)]) {
      [self.delegate navBarItemViewDidChangeSize:self];
    }
  }
}

- (BOOL)needsAutoLayout {
  if (@available(iOS 26.0, *)) {
    return _slotType == TrueSheetNavBarItemViewSlotType::Left || _slotType == TrueSheetNavBarItemViewSlotType::Right;
  }
  return NO;
}

- (UIBarButtonItem *)barButtonItem {
  if (_barButtonItem) {
    return _barButtonItem;
  }

  if (self.needsAutoLayout) {
    // iOS 26 stretches bar button custom views to a minimum width — a wrapper
    // centers this view inside itself so children stay centered
    UIView *wrapperView = [[UIView alloc] init];
    wrapperView.translatesAutoresizingMaskIntoConstraints = NO;
    self.translatesAutoresizingMaskIntoConstraints = NO;
    [wrapperView addSubview:self];

    [self.centerXAnchor constraintEqualToAnchor:wrapperView.centerXAnchor].active = YES;
    [self.centerYAnchor constraintEqualToAnchor:wrapperView.centerYAnchor].active = YES;

    // High priority (not required) — when UIKit stretches the wrapper past
    // this view's size, the wrapper constraint breaks instead of UIKit's
    NSLayoutConstraint *widthEqual = [wrapperView.widthAnchor constraintEqualToAnchor:self.widthAnchor];
    widthEqual.priority = UILayoutPriorityDefaultHigh;
    widthEqual.active = YES;

    NSLayoutConstraint *heightEqual = [wrapperView.heightAnchor constraintEqualToAnchor:self.heightAnchor];
    heightEqual.priority = UILayoutPriorityDefaultHigh;
    heightEqual.active = YES;

    [self setContentHuggingPriority:UILayoutPriorityRequired forAxis:UILayoutConstraintAxisHorizontal];
    [self setContentHuggingPriority:UILayoutPriorityRequired forAxis:UILayoutConstraintAxisVertical];
    [self setContentCompressionResistancePriority:UILayoutPriorityRequired forAxis:UILayoutConstraintAxisHorizontal];
    [self setContentCompressionResistancePriority:UILayoutPriorityRequired forAxis:UILayoutConstraintAxisVertical];

    _barButtonItem = [[UIBarButtonItem alloc] initWithCustomView:wrapperView];
  } else {
    _barButtonItem = [[UIBarButtonItem alloc] initWithCustomView:self];
  }

  return _barButtonItem;
}

- (CGSize)contentSize {
  return _lastSize;
}

- (CGSize)intrinsicContentSize {
  return _lastSize;
}

- (CGSize)sizeThatFits:(CGSize)size {
  return _lastSize;
}

- (void)prepareForRecycle {
  [super prepareForRecycle];
  [self removeFromSuperview];
  self.translatesAutoresizingMaskIntoConstraints = YES;
  _barButtonItem = nil;
  _lastSize = CGSizeZero;
  _slotType = TrueSheetNavBarItemViewSlotType::Left;
  self.delegate = nil;
}

@end

Class<RCTComponentViewProtocol> TrueSheetNavBarItemViewCls(void) {
  return TrueSheetNavBarItemView.class;
}

#endif  // RCT_NEW_ARCH_ENABLED
