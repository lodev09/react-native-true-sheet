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

// Between the minimized keyboard (up to ~180pt) and the shortest docked iPad
// keyboard (~340pt)
static const CGFloat kMinimizedKeyboardMaxHeight = 250.0;

static const NSTimeInterval kUnanimatedKeyboardDuration = 0.25;

@implementation TrueSheetKeyboardObserver {
  NSHashTable<id<TrueSheetKeyboardObserverDelegate>> *_delegates;
  CGFloat _currentHeight;
  CGFloat _pendingMinimizedKeyboardOverlap;
  CFTimeInterval _animationEndTime;
}

- (CGFloat)currentHeight {
  return _currentHeight;
}

- (NSTimeInterval)remainingAnimationDuration {
  return MAX(0, _animationEndTime - CACurrentMediaTime());
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
  NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
  [center addObserver:self
             selector:@selector(keyboardWillChangeFrame:)
                 name:UIKeyboardWillChangeFrameNotification
               object:nil];
  [center addObserver:self selector:@selector(keyboardWillShow:) name:UIKeyboardWillShowNotification object:nil];
  [center addObserver:self selector:@selector(keyboardWillHide:) name:UIKeyboardWillHideNotification object:nil];
}

- (void)stop {
  NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
  [center removeObserver:self name:UIKeyboardWillChangeFrameNotification object:nil];
  [center removeObserver:self name:UIKeyboardWillShowNotification object:nil];
  [center removeObserver:self name:UIKeyboardWillHideNotification object:nil];
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

// iPadOS 26 reports its minimized keyboard (the pill left after hiding the
// keyboard while the input keeps focus) as a short docked keyboard. An input
// accessory view does stay docked across the bottom edge, so it still counts.
- (BOOL)isMinimizedKeyboardFrame:(CGRect)frame {
  if (@available(iOS 26.0, *)) {
    if (UIDevice.currentDevice.userInterfaceIdiom != UIUserInterfaceIdiomPad) {
      return NO;
    }
    UIView *firstResponder = [_viewController.view findFirstResponder];
    return frame.size.height < kMinimizedKeyboardMaxHeight && !firstResponder.inputAccessoryView;
  }
  return NO;
}

- (void)keyboardWillChangeFrame:(NSNotification *)notification {
  NSDictionary *userInfo = notification.userInfo;
  CGRect keyboardFrame = [userInfo[UIKeyboardFrameEndUserInfoKey] CGRectValue];
  NSTimeInterval duration = [userInfo[UIKeyboardAnimationDurationUserInfoKey] doubleValue];
  UIViewAnimationOptions curve = [userInfo[UIKeyboardAnimationCurveUserInfoKey] unsignedIntegerValue] << 16;

  UIWindow *window = _viewController.view.window;
  if (!window) {
    return;
  }

  CGRect keyboardFrameInWindow = [window convertRect:keyboardFrame fromWindow:nil];
  // A floating iPad keyboard is narrower than the window: it covers no edge and
  // UIKit doesn't grow the sheet for it, so it counts as hidden. Width only — a
  // windowed app gets docked frames offset by the window's inset.
  BOOL floating = CGRectGetWidth(keyboardFrameInWindow) < CGRectGetWidth(window.bounds) - 1;
  CGFloat keyboardHeight = floating ? 0 : MAX(0, window.bounds.size.height - keyboardFrameInWindow.origin.y);
  CGFloat minimizedKeyboardOverlap = 0;

  // Not gated on being topmost: UIKit restores (and an app may blur) a sheet's
  // input while a stacked child is still dismissing over it. A hide reaches
  // every sheet that rose, even one that no longer holds the first responder.
  if (keyboardHeight > 0) {
    if (![self isFirstResponderWithinSheet]) {
      return;
    }
    // The minimized keyboard floats in a corner and covers nothing — treat it
    // as hidden, and offset the growth UIKit still applies for it.
    if ([self isMinimizedKeyboardFrame:keyboardFrameInWindow]) {
      UIView *sheetView = _viewController.view;
      CGFloat sheetBottom = CGRectGetMaxY([sheetView convertRect:sheetView.bounds toView:nil]);
      minimizedKeyboardOverlap =
        MAX(0, MIN(CGRectGetMaxY(keyboardFrameInWindow), sheetBottom) - CGRectGetMinY(keyboardFrameInWindow));
      keyboardHeight = 0;
    }
  }

  // Hiding a full keyboard ends either minimized or fully hidden, and UIKit
  // only tells which (show or hide) after it has laid out the sheet for it.
  _pendingMinimizedKeyboardOverlap = 0;
  if (minimizedKeyboardOverlap > 0 && _currentHeight > 0) {
    _pendingMinimizedKeyboardOverlap = minimizedKeyboardOverlap;
    minimizedKeyboardOverlap = 0;
  }

  CGFloat previousOverlap = _viewController.minimizedKeyboardOverlap;
  _viewController.minimizedKeyboardOverlap = minimizedKeyboardOverlap;

  if (keyboardHeight == 0 && _currentHeight == 0 && minimizedKeyboardOverlap == previousOverlap) {
    return;
  }

  // Docking or undocking the floating keyboard comes unanimated — animate the
  // footer and scrollable insets ourselves instead of snapping them.
  if (duration == 0 && (keyboardHeight > 0) != (_currentHeight > 0)) {
    duration = kUnanimatedKeyboardDuration;
  }

  _currentHeight = keyboardHeight;
  _animationEndTime = CACurrentMediaTime() + duration;
  _animationCurve = curve;

  // UIKit also moves the sheet as the minimized keyboard comes and goes, by
  // whatever the detents couldn't absorb — settle again once it's done.
  if (keyboardHeight > 0 || minimizedKeyboardOverlap != previousOverlap) {
    _viewController.keyboardSheetGrown = YES;
  }

  if (keyboardHeight == 0) {
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

  _viewController.keyboardHeight = keyboardHeight;

  for (id<TrueSheetKeyboardObserverDelegate> delegate in _delegates) {
    if (keyboardHeight > 0) {
      [delegate keyboardWillShow:keyboardHeight duration:duration curve:curve];
    } else {
      [delegate keyboardWillHide:duration curve:curve];
    }
  }
}

// Shown minimized: UIKit has grown the sheet for it already, take it back.
- (void)keyboardWillShow:(NSNotification *)notification {
  if (_pendingMinimizedKeyboardOverlap == 0) {
    return;
  }

  _viewController.minimizedKeyboardOverlap = _pendingMinimizedKeyboardOverlap;
  _pendingMinimizedKeyboardOverlap = 0;
  _viewController.keyboardSheetGrown = YES;
  [_viewController invalidateDetents];
}

- (void)keyboardWillHide:(NSNotification *)notification {
  _pendingMinimizedKeyboardOverlap = 0;
}

@end

#endif
