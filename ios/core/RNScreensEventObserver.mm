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
  std::shared_ptr<const EventDispatcher> _eventDispatcher;
  std::shared_ptr<const EventListener> _eventListener;
  NSInteger _presenterScreenTag;
  __weak UIViewController *_presenterScreenController;
  NSInteger _parentModalTag;
}

- (instancetype)init {
  if (self = [super init]) {
    _presenterScreenTag = 0;
    _presenterScreenController = nil;
    _parentModalTag = 0;
  }
  return self;
}

- (void)dealloc {
  [self stopObserving];
}

- (void)startObservingWithState:(const TrueSheetViewState &)state {
  if (_eventDispatcher) {
    return;
  }

  if (auto dispatcherPtr = state.getEventDispatcher().lock()) {
    _eventDispatcher = dispatcherPtr;

    __weak RNScreensEventObserver *weakSelf = self;

    _eventListener = std::make_shared<const EventListener>([weakSelf](const RawEvent &event) {
      RNScreensEventObserver *strongSelf = weakSelf;
      if (!strongSelf) {
        return false;
      }

      if (event.type == "topWillDisappear") {
        if (auto family = event.shadowNodeFamily.lock()) {
          Tag screenTag = family->getTag();

          if ([strongSelf shouldDismissForScreenTag:screenTag]) {
            [strongSelf.delegate presenterScreenWillDisappear];
          }
        }
      }
      return false;
    });

    _eventDispatcher->addListener(_eventListener);
  }
}

- (void)stopObserving {
  if (_eventListener) {
    _eventDispatcher->removeListener(_eventListener);
    _eventListener = nullptr;
    _eventDispatcher = nullptr;
  }
}

- (void)capturePresenterScreenFromView:(UIView *)view {
  _presenterScreenTag = 0;
  _presenterScreenController = nil;
  _parentModalTag = 0;

  for (UIView *current = view.superview; current; current = current.superview) {
    NSString *className = NSStringFromClass([current class]);

    if (!_presenterScreenTag && [className isEqualToString:@"RNSScreenView"]) {
      _presenterScreenTag = current.tag;
      for (UIResponder *r = current.nextResponder; r; r = r.nextResponder) {
        if ([r isKindOfClass:[UIViewController class]]) {
          _presenterScreenController = (UIViewController *)r;
          break;
        }
      }
    } else if ([className isEqualToString:@"RNSModalScreen"]) {
      _parentModalTag = current.tag;
      break;
    }
  }
}

- (BOOL)shouldDismissForScreenTag:(NSInteger)screenTag {
  if (_presenterScreenTag != screenTag) {
    return NO;
  }

  // If inside a modal, skip if screen is top of nav stack (modal dismiss)
  if (_parentModalTag != 0) {
    UINavigationController *nav = _presenterScreenController.navigationController;
    if (nav.topViewController == _presenterScreenController) {
      return NO;
    }
  }

  return YES;
}

@end

#endif // RCT_NEW_ARCH_ENABLED
