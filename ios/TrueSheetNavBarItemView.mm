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
  // UIKit owns this view's position inside the bar — apply Yoga's size only,
  // otherwise the frame origin (relative to the config view) would offset it.
  auto adjustedMetrics = layoutMetrics;
  adjustedMetrics.frame.origin = {0, 0};
  [super updateLayoutMetrics:adjustedMetrics oldLayoutMetrics:oldLayoutMetrics];

  CGSize newSize = CGSizeMake(layoutMetrics.frame.size.width, layoutMetrics.frame.size.height);
  if (!CGSizeEqualToSize(newSize, _lastSize)) {
    _lastSize = newSize;
    [self invalidateIntrinsicContentSize];

    if ([self.delegate respondsToSelector:@selector(navBarItemViewDidChangeSize:)]) {
      [self.delegate navBarItemViewDidChangeSize:self];
    }
  }
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
  _lastSize = CGSizeZero;
  _slotType = TrueSheetNavBarItemViewSlotType::Left;
  self.delegate = nil;
}

@end

Class<RCTComponentViewProtocol> TrueSheetNavBarItemViewCls(void) {
  return TrueSheetNavBarItemView.class;
}

#endif  // RCT_NEW_ARCH_ENABLED
