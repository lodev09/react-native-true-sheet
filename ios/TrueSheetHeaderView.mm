//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "TrueSheetHeaderView.h"
#import <react/renderer/components/TrueSheetSpec/ComponentDescriptors.h>
#import <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>
#import <react/renderer/components/TrueSheetSpec/RCTComponentViewHelpers.h>
#import "utils/LayoutUtil.h"

using namespace facebook::react;

@implementation TrueSheetHeaderView {
  CGSize _lastSize;
  UILabel *_edgeEffectHint;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<TrueSheetHeaderViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const TrueSheetHeaderViewProps>();
    _props = defaultProps;

    _lastSize = CGSizeZero;
  }
  return self;
}

- (void)updateLayoutMetrics:(const facebook::react::LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const facebook::react::LayoutMetrics &)oldLayoutMetrics {
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  CGSize newSize = CGSizeMake(layoutMetrics.frame.size.width, layoutMetrics.frame.size.height);

  if (!CGSizeEqualToSize(newSize, _lastSize)) {
    _lastSize = newSize;
    [self.delegate headerViewDidChangeSize:newSize];
  }
}

- (void)prepareForRecycle {
  [super prepareForRecycle];
  _lastSize = CGSizeZero;

  if (@available(iOS 26.0, *)) {
    [self cleanupEdgeInteraction];
  }
}

#pragma mark - Scroll Edge Interaction

- (void)cleanupEdgeInteraction API_AVAILABLE(ios(26.0)) {
  for (id<UIInteraction> interaction in [self.interactions copy]) {
    if ([interaction isKindOfClass:[UIScrollEdgeElementContainerInteraction class]]) {
      [self removeInteraction:interaction];
      break;
    }
  }

  [_edgeEffectHint removeFromSuperview];
  _edgeEffectHint = nil;
}

- (void)setupEdgeInteractionWithScrollView:(UIScrollView *)scrollView API_AVAILABLE(ios(26.0)) {
  [self cleanupEdgeInteraction];

  if (!scrollView) {
    return;
  }

  // UIScrollEdgeElementContainerInteraction requires standard UIKit element
  // descendants (UILabel, UIControl, etc.) to trigger the edge effect.
  // RCTViewComponentView subviews are not recognized, so we add a
  // non-visible UILabel as an element hint.
  _edgeEffectHint = [[UILabel alloc] initWithFrame:self.bounds];
  _edgeEffectHint.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  _edgeEffectHint.userInteractionEnabled = NO;
  [self addSubview:_edgeEffectHint];

  UIScrollEdgeElementContainerInteraction *interaction = [[UIScrollEdgeElementContainerInteraction alloc] init];
  interaction.scrollView = scrollView;
  interaction.edge = UIRectEdgeTop;
  [self addInteraction:interaction];
}

@end

Class<RCTComponentViewProtocol> TrueSheetHeaderViewCls(void) {
  return TrueSheetHeaderView.class;
}

#endif
