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
