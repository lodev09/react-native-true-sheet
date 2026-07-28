//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "TrueSheetKeyboardObserver.h"
#import "../TrueSheetViewController.h"
#import "../utils/UIView+FirstResponder.h"

@implementation TrueSheetKeyboardObserver {
  NSHashTable<id<TrueSheetKeyboardObserverDelegate>> *_delegates;
  CGFloat _currentHeight;
}

- (CGFloat)currentHeight {
  return _currentHeight;
}

- (instancetype)init {
  if (self = [super init]) {
    _delegates = [NSHashTable weakObjectsHashTable];
  }
  return self;
}

- (void)addDelegate:(id<TrueSheetKeyboardObserverDelegate>)delegate {
  [_delegates addObject:delegate];
}

- (void)removeDelegate:(id<TrueSheetKeyboardObserverDelegate>)delegate {
  [_delegates removeObject:delegate];
}

- (void)start {
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(keyboardWillChangeFrame:)
                                               name:UIKeyboardWillChangeFrameNotification
                                             object:nil];
}

- (void)stop {
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillChangeFrameNotification object:nil];
}

- (void)dealloc {
  [self stop];
}

- (BOOL)isFirstResponderWithinSheet {
  if (!_viewController) {
    return NO;
  }
  UIView *firstResponder = [_viewController.view findFirstResponder];
  return firstResponder != nil;
}

- (void)keyboardWillChangeFrame:(NSNotification *)notification {
  if (_viewController && !_viewController.isTopmostPresentedController) {
    return;
  }

  if (![self isFirstResponderWithinSheet]) {
    return;
  }

  NSDictionary *userInfo = notification.userInfo;
  CGRect keyboardFrame = [userInfo[UIKeyboardFrameEndUserInfoKey] CGRectValue];
  NSTimeInterval duration = [userInfo[UIKeyboardAnimationDurationUserInfoKey] doubleValue];
  UIViewAnimationOptions curve = [userInfo[UIKeyboardAnimationCurveUserInfoKey] unsignedIntegerValue] << 16;

  UIWindow *window = _viewController.view.window;
  if (!window) {
    return;
  }

  CGRect keyboardFrameInWindow = [window convertRect:keyboardFrame fromWindow:nil];
  CGFloat keyboardHeight = MAX(0, window.bounds.size.height - keyboardFrameInWindow.origin.y);

  _currentHeight = keyboardHeight;

  if (keyboardHeight > 0) {
    _viewController.keyboardSheetGrown = YES;
  } else {
    // The sheet stays grown until UIKit finishes the shrink-back animation —
    // clear after it completes, unless the keyboard came back in the meantime.
    __weak __typeof(self) weakSelf = self;
    dispatch_after(
      dispatch_time(DISPATCH_TIME_NOW, (int64_t)((duration + 0.1) * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        __strong __typeof(weakSelf) strongSelf = weakSelf;
        if (strongSelf && strongSelf->_currentHeight == 0) {
          strongSelf->_viewController.keyboardSheetGrown = NO;
        }
      });
  }

  for (id<TrueSheetKeyboardObserverDelegate> delegate in _delegates) {
    if (keyboardHeight > 0) {
      [delegate keyboardWillShow:keyboardHeight duration:duration curve:curve];
    } else {
      [delegate keyboardWillHide:duration curve:curve];
    }
  }
}

@end

#endif
