//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "GestureUtil.h"

#import <objc/runtime.h>

static const void *kTouchOriginFilterKey = &kTouchOriginFilterKey;

@interface TrueSheetTouchOriginFilter : NSObject <UIGestureRecognizerDelegate>
@property (nonatomic, weak) UIView *boundsView;
@property (nonatomic, weak) id<UIGestureRecognizerDelegate> originalDelegate;
@end

@implementation TrueSheetTouchOriginFilter

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldReceiveTouch:(UITouch *)touch {
  UIView *boundsView = self.boundsView;
  if (boundsView != nil && !CGRectContainsPoint(boundsView.bounds, [touch locationInView:boundsView])) {
    return NO;
  }

  id<UIGestureRecognizerDelegate> original = self.originalDelegate;
  if ([original respondsToSelector:@selector(gestureRecognizer:shouldReceiveTouch:)]) {
    return [original gestureRecognizer:gestureRecognizer shouldReceiveTouch:touch];
  }

  return YES;
}

- (BOOL)respondsToSelector:(SEL)aSelector {
  if ([super respondsToSelector:aSelector]) {
    return YES;
  }
  return [self.originalDelegate respondsToSelector:aSelector];
}

- (id)forwardingTargetForSelector:(SEL)aSelector {
  return self.originalDelegate;
}

@end

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

+ (void)restrictPanGesturesToSheetView:(UIView *)view {
  if (!view) {
    return;
  }

  for (UIView *node = view; node != nil; node = node.superview) {
    for (UIGestureRecognizer *recognizer in node.gestureRecognizers ?: @[]) {
      if (![recognizer isKindOfClass:[UIPanGestureRecognizer class]]) {
        continue;
      }

      if ([node isKindOfClass:[UIScrollView class]] &&
          recognizer == ((UIScrollView *)node).panGestureRecognizer) {
        continue;
      }

      if ([recognizer.delegate isKindOfClass:[TrueSheetTouchOriginFilter class]]) {
        ((TrueSheetTouchOriginFilter *)recognizer.delegate).boundsView = view;
        continue;
      }

      TrueSheetTouchOriginFilter *filter = [TrueSheetTouchOriginFilter new];
      filter.boundsView = view;
      filter.originalDelegate = recognizer.delegate;
      recognizer.delegate = filter;

      // `delegate` is weak
      objc_setAssociatedObject(recognizer, kTouchOriginFilterKey, filter, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    }
  }
}

@end