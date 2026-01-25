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
  NSInteger _presenterScreenTag;
  NSMutableSet<NSNumber *> *_screenTags;
  __weak UIViewController *_presenterScreenController;
  __weak UIViewController *_parentScreenController;
  __weak UIWindow *_window;
  BOOL _dismissedByNavigation;
}

- (instancetype)init {
  if (self = [super init]) {
    _presenterScreenTag = 0;
    _screenTags = [NSMutableSet new];
    _presenterScreenController = nil;
    _parentScreenController = nil;
    _window = nil;
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
          if ([strongSelf->_screenTags containsObject:@(screenTag)]) {
            if ([strongSelf shouldDismissForScreenTag:screenTag]) {
              strongSelf->_dismissedByNavigation = YES;
              [strongSelf.delegate presenterScreenWillDisappear];
            }
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
  _presenterScreenTag = 0;
  [_screenTags removeAllObjects];
  _presenterScreenController = nil;
  _parentScreenController = nil;
  _window = view.window;

  for (UIView *current = view.superview; current; current = current.superview) {
    if ([NSStringFromClass([current class]) isEqualToString:@"RNSScreenView"]) {
      [_screenTags addObject:@(current.tag)];

      UIViewController *screenVC = nil;
      for (UIResponder *r = current.nextResponder; r; r = r.nextResponder) {
        if ([r isKindOfClass:[UIViewController class]]) {
          screenVC = (UIViewController *)r;
          break;
        }
      }

      if (!_presenterScreenController) {
        _presenterScreenTag = current.tag;
        _presenterScreenController = screenVC;
      } else if (!_parentScreenController && screenVC) {
        _parentScreenController = screenVC;
      }
    }
  }
}

- (BOOL)shouldDismissForScreenTag:(NSInteger)screenTag {
  // For parent screens (not immediate presenter), check if the presenter screen is being removed
  // This handles nested stack removal case
  if (screenTag != _presenterScreenTag) {
    UINavigationController *parentNav = _parentScreenController.navigationController;

    // Modal case: parent's nav is presented -> let sheet dismiss naturally
    // Nested stack case: parent's nav is not presented (embedded) -> need to dismiss
    if (parentNav.presentingViewController != nil) {
      return NO;
    }

    if (!_parentScreenController) {
      return NO;
    }

    // If presenter view is no longer in window, the nested stack is being removed
    UIView *presenterView = [_window viewWithTag:_presenterScreenTag];
    if (presenterView == nil || presenterView.window == nil) {
      return YES;
    }

    return NO;
  }

  // For immediate presenter screen
  UINavigationController *navController = _presenterScreenController.navigationController;

  if (!navController || navController.isBeingDismissed) {
    return YES;
  }

  // Dismiss if presenter is no longer top of nav stack (pushed/popped)
  // Skip if still top (e.g. modal dismiss - sheet dismisses naturally)
  return navController.topViewController != _presenterScreenController;
}

@end

#endif  // RCT_NEW_ARCH_ENABLED
