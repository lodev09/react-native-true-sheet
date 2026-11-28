//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import <objc/runtime.h>
#import "PlatformUtil.h"
#import "UIView+ScrollEdgeInteraction.h"

static const void *kEdgeEffectHintKey = &kEdgeEffectHintKey;

// UIKit sizes the effect to 60pt past the element edge facing the scroll edge.
// Sitting the hint this far in from the container's inner edge ends the effect
// 12pt past the container, like a native bar, at any container height.
static const CGFloat kEdgeEffectHintInset = 48;

static CGRect EdgeEffectHintFrame(CGRect bounds, BOOL isTopEdge) {
  CGFloat height = CGRectGetHeight(bounds);
  CGFloat y = isTopEdge ? MAX(0, height - kEdgeEffectHintInset) : MAX(0, MIN(height, kEdgeEffectHintInset) - 1);
  return CGRectMake(0, y, 1, 1);
}

@implementation UIView (ScrollEdgeInteraction)

- (void)cleanupEdgeInteraction API_AVAILABLE(ios(26.0)) {
#if RNTS_IPHONE_OS_VERSION_AVAILABLE(26_0)
  for (id<UIInteraction> interaction in [self.interactions copy]) {
    if ([interaction isKindOfClass:[UIScrollEdgeElementContainerInteraction class]]) {
      [self removeInteraction:interaction];
      break;
    }
  }
#endif

  UILabel *hint = objc_getAssociatedObject(self, kEdgeEffectHintKey);
  [hint removeFromSuperview];
  objc_setAssociatedObject(self, kEdgeEffectHintKey, nil, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (nullable UIScrollView *)edgeInteractionScrollView API_AVAILABLE(ios(26.0)) {
#if RNTS_IPHONE_OS_VERSION_AVAILABLE(26_0)
  for (id<UIInteraction> interaction in self.interactions) {
    if ([interaction isKindOfClass:[UIScrollEdgeElementContainerInteraction class]]) {
      return ((UIScrollEdgeElementContainerInteraction *)interaction).scrollView;
    }
  }
#endif
  return nil;
}

- (void)setupEdgeInteractionWithScrollView:(nullable UIScrollView *)scrollView
                                      edge:(UIRectEdge)edge API_AVAILABLE(ios(26.0)) {
  if (!scrollView) {
    [self cleanupEdgeInteraction];
    return;
  }

#if RNTS_IPHONE_OS_VERSION_AVAILABLE(26_0)
  BOOL isTopEdge = edge == UIRectEdgeTop;
  UILabel *existingHint = objc_getAssociatedObject(self, kEdgeEffectHintKey);
  existingHint.frame = EdgeEffectHintFrame(self.bounds, isTopEdge);

  // Update in place — this re-runs on every footer/header size change, and
  // tearing the interaction down mid keyboard animation flashes the edge
  // effect at the footer's final position.
  for (id<UIInteraction> interaction in self.interactions) {
    if ([interaction isKindOfClass:[UIScrollEdgeElementContainerInteraction class]]) {
      UIScrollEdgeElementContainerInteraction *existing = (UIScrollEdgeElementContainerInteraction *)interaction;
      existing.scrollView = scrollView;
      existing.edge = edge;
      return;
    }
  }

  // UIScrollEdgeElementContainerInteraction requires standard UIKit element
  // descendants (UILabel, UIControl, etc.) to trigger the edge effect.
  // RCTViewComponentView subviews are not recognized, so we add a
  // non-visible UILabel as an element hint. iOS 27+ ignores a full-size empty
  // label when applying the soft effect, so the hint is 1x1.
  UILabel *hint = [[UILabel alloc] initWithFrame:EdgeEffectHintFrame(self.bounds, isTopEdge)];
  hint.userInteractionEnabled = NO;
  [self addSubview:hint];
  objc_setAssociatedObject(self, kEdgeEffectHintKey, hint, OBJC_ASSOCIATION_RETAIN_NONATOMIC);

  UIScrollEdgeElementContainerInteraction *interaction = [[UIScrollEdgeElementContainerInteraction alloc] init];
  interaction.scrollView = scrollView;
  interaction.edge = edge;
  [self addInteraction:interaction];
#endif
}

@end

#endif
