//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "UIView+ScrollEdgeInteraction.h"
#import <objc/runtime.h>

static const void *kEdgeEffectHintKey = &kEdgeEffectHintKey;

@implementation UIView (ScrollEdgeInteraction)

- (void)cleanupEdgeInteraction API_AVAILABLE(ios(26.0)) {
  for (id<UIInteraction> interaction in [self.interactions copy]) {
    if ([interaction isKindOfClass:[UIScrollEdgeElementContainerInteraction class]]) {
      [self removeInteraction:interaction];
      break;
    }
  }

  UILabel *hint = objc_getAssociatedObject(self, kEdgeEffectHintKey);
  [hint removeFromSuperview];
  objc_setAssociatedObject(self, kEdgeEffectHintKey, nil, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (void)setupEdgeInteractionWithScrollView:(nullable UIScrollView *)scrollView
                                      edge:(UIRectEdge)edge API_AVAILABLE(ios(26.0)) {
  [self cleanupEdgeInteraction];

  if (!scrollView) {
    return;
  }

  // UIScrollEdgeElementContainerInteraction requires standard UIKit element
  // descendants (UILabel, UIControl, etc.) to trigger the edge effect.
  // RCTViewComponentView subviews are not recognized, so we add a
  // non-visible UILabel as an element hint.
  UILabel *hint = [[UILabel alloc] initWithFrame:self.bounds];
  hint.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  hint.userInteractionEnabled = NO;
  [self addSubview:hint];
  objc_setAssociatedObject(self, kEdgeEffectHintKey, hint, OBJC_ASSOCIATION_RETAIN_NONATOMIC);

  UIScrollEdgeElementContainerInteraction *interaction = [[UIScrollEdgeElementContainerInteraction alloc] init];
  interaction.scrollView = scrollView;
  interaction.edge = edge;
  [self addInteraction:interaction];
}

@end

#endif
