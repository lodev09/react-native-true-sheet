//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "RNScreensEventObserver.h"
#import "TrueSheetView.h"

#import <react/renderer/core/EventDispatcher.h>
#import <react/renderer/core/ShadowNodeFamily.h>

using namespace facebook::react;

@implementation RNScreensEventObserver {
  std::weak_ptr<const EventDispatcher> _eventDispatcher;
  std::shared_ptr<const EventListener> _eventListener;
  NSMutableSet<NSNumber *> *_screenTags;
  __weak UIViewController *_presenterScreenController;
  BOOL _dismissedByNavigation;
}

- (instancetype)init {
  if (self = [super init]) {
    _screenTags = [NSMutableSet new];
    _presenterScreenController = nil;
  }
  return self;
}

- (void)dealloc {
  [self stopObserving];
}

- (void)startObservingWithState:(const TrueSheetViewState &)state {
  if (!_eventDispatcher.expired()) {
    return;
  }

  if (auto dispatcherPtr = state.getEventDispatcher().lock()) {
    _eventDispatcher = state.getEventDispatcher();

    __weak RNScreensEventObserver *weakSelf = self;

    _eventListener = std::make_shared<const EventListener>([weakSelf](const RawEvent &event) {
      RNScreensEventObserver *strongSelf = weakSelf;
      if (!strongSelf) {
        return false;
      }

      if (auto family = event.shadowNodeFamily.lock()) {
        Tag screenTag = family->getTag();

        if (event.type == "topWillDisappear") {
          if ([strongSelf shouldDismissForScreenTag:screenTag]) {
            strongSelf->_dismissedByNavigation = YES;
            [strongSelf.delegate presenterScreenWillDisappear];
          }
        } else if (event.type == "topWillAppear") {
          if ([strongSelf->_screenTags containsObject:@(screenTag)] && strongSelf->_dismissedByNavigation) {
            strongSelf->_dismissedByNavigation = NO;
            [strongSelf.delegate presenterScreenWillAppear];
          }
        }
      }
      return false;
    });

    dispatcherPtr->addListener(_eventListener);
  }
}

- (void)stopObserving {
  if (_eventListener) {
    if (auto dispatcher = _eventDispatcher.lock()) {
      dispatcher->removeListener(_eventListener);
    }
    _eventListener = nullptr;
  }
  _eventDispatcher.reset();
}

- (void)capturePresenterScreenFromView:(UIView *)view {
  [_screenTags removeAllObjects];
  _presenterScreenController = nil;

  for (UIView *current = view.superview; current; current = current.superview) {
    if ([NSStringFromClass([current class]) isEqualToString:@"RNSScreenView"]) {
      [_screenTags addObject:@(current.tag)];

      // Capture the view controller from the first (immediate presenter) screen
      if (!_presenterScreenController) {
        for (UIResponder *r = current.nextResponder; r; r = r.nextResponder) {
          if ([r isKindOfClass:[UIViewController class]]) {
            _presenterScreenController = (UIViewController *)r;
            break;
          }
        }
      }
    }
  }
}

- (BOOL)shouldDismissForScreenTag:(NSInteger)screenTag {
  if (![_screenTags containsObject:@(screenTag)]) {
    return NO;
  }

  UINavigationController *navController = _presenterScreenController.navigationController;

  // If nav controller is nil or being dismissed, dismiss the sheet
  if (!navController || navController.isBeingDismissed) {
    return YES;
  }

  // Skip if screen is still top of nav stack (e.g. modal dismiss - sheet dismisses naturally with modal)
  // Dismiss if a new screen was pushed or popped
  return navController.topViewController != _presenterScreenController;
}

@end

#endif  // RCT_NEW_ARCH_ENABLED
