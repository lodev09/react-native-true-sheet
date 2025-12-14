//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "WindowUtil.h"

@implementation WindowUtil

+ (nullable UIWindow *)keyWindow {
  NSSet<UIScene *> *connectedScenes = [UIApplication sharedApplication].connectedScenes;

  UIWindow *fallbackWindow = nil;

  for (UIScene *scene in connectedScenes) {
    if ([scene isKindOfClass:[UIWindowScene class]]) {
      UIWindowScene *windowScene = (UIWindowScene *)scene;

      // Check for foreground active first (preferred)
      if (windowScene.activationState == UISceneActivationStateForegroundActive) {
        for (UIWindow *window in windowScene.windows) {
          if (window.isKeyWindow) {
            return window;
          }
        }

        // If no key window found, return the first window
        if (windowScene.windows.count > 0) {
          return windowScene.windows.firstObject;
        }
      }

      // Store a fallback window for transitional states (e.g., deep link handling from background or cold start)
      if (fallbackWindow == nil && windowScene.windows.count > 0) {
        for (UIWindow *window in windowScene.windows) {
          if (window.isKeyWindow) {
            fallbackWindow = window;
            break;
          }
        }
        if (fallbackWindow == nil) {
          fallbackWindow = windowScene.windows.firstObject;
        }
      }
    }
  }

  return fallbackWindow;
}

@end

#endif