//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "GestureUtil.h"

@implementation GestureUtil

+ (void)attachPanGestureHandler:(UIView *)view target:(id)target selector:(SEL)selector {
  if (!view || !target || !selector) {
    return;
  }

  for (UIGestureRecognizer *recognizer in view.gestureRecognizers ?: @[]) {
    if ([recognizer isKindOfClass:[UIPanGestureRecognizer class]]) {
      UIPanGestureRecognizer *panGesture = (UIPanGestureRecognizer *)recognizer;
      [panGesture addTarget:target action:selector];
    }
  }
}

+ (void)setPanGesturesEnabled:(BOOL)enabled forView:(UIView *)view {
  if (!view) {
    return;
  }

  for (UIGestureRecognizer *recognizer in view.gestureRecognizers ?: @[]) {
    if ([recognizer isKindOfClass:[UIPanGestureRecognizer class]]) {
      recognizer.enabled = enabled;
    }
  }
}

@end