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

static const CGFloat kMinSmoothingOffset = 1.0;
static const NSTimeInterval kFallbackAnimationDuration = 0.25;

@implementation TrueSheetKeyboardObserver {
  NSHashTable<id<TrueSheetKeyboardObserverDelegate>> *_delegates;
  CGFloat _currentHeight;
  BOOL _isKeyboardVisibleForSheet;
  BOOL _isSmoothingKeyboardHide;
  BOOL _isHandlingHide;
  __weak UIView *_smoothingPresentedView;
  CGAffineTransform _smoothingOriginalTransform;
  NSUInteger _smoothingToken;
}

- (CGFloat)currentHeight {
  return _currentHeight;
}

- (instancetype)init {
  if (self = [super init]) {
    _delegates = [NSHashTable weakObjectsHashTable];
    _smoothingOriginalTransform = CGAffineTransformIdentity;
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
                                           selector:@selector(handleKeyboardNotification:)
                                               name:UIKeyboardWillChangeFrameNotification
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleKeyboardNotification:)
                                               name:UIKeyboardWillHideNotification
                                             object:nil];
}

- (void)stop {
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillChangeFrameNotification object:nil];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillHideNotification object:nil];

  ++_smoothingToken;
  UIView *presented = _smoothingPresentedView;
  if (presented && _isSmoothingKeyboardHide) {
    [presented.layer removeAllAnimations];
    presented.transform = _smoothingOriginalTransform;
  }

  _currentHeight = 0;
  _isKeyboardVisibleForSheet = NO;
  _isSmoothingKeyboardHide = NO;
  _isHandlingHide = NO;
  _smoothingPresentedView = nil;
  _smoothingOriginalTransform = CGAffineTransformIdentity;
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

- (void)smoothKeyboardHideWithDuration:(NSTimeInterval)duration curve:(UIViewAnimationOptions)curve {
  if (_isSmoothingKeyboardHide || !_viewController) {
    return;
  }

  UIView *presented = _viewController.presentationController.presentedView;
  if (!presented) {
    return;
  }

  // presentationLayer is nil when no animation is in flight; in that case the
  // model frame already matches what's on screen, so the offset below resolves to 0.
  CALayer *presentationLayer = presented.layer.presentationLayer;
  CGFloat visualY = presentationLayer ? presentationLayer.frame.origin.y : presented.frame.origin.y;

  _isSmoothingKeyboardHide = YES;
  _smoothingPresentedView = presented;
  _smoothingOriginalTransform = presented.transform;
  NSUInteger token = ++_smoothingToken;

  __weak __typeof(self) weakSelf = self;
  __weak UIView *weakPresented = presented;

  dispatch_async(dispatch_get_main_queue(), ^{
    __strong __typeof(weakSelf) strongSelf = weakSelf;
    if (!strongSelf || strongSelf->_smoothingToken != token) {
      return;
    }

    UIView *strongPresented = weakPresented;
    if (!strongPresented) {
      strongSelf->_isSmoothingKeyboardHide = NO;
      strongSelf->_smoothingPresentedView = nil;
      return;
    }

    [strongPresented layoutIfNeeded];
    CGFloat snappedY = strongPresented.frame.origin.y;
    CGFloat offset = visualY - snappedY;
    if (fabs(offset) < kMinSmoothingOffset) {
      strongSelf->_isSmoothingKeyboardHide = NO;
      strongSelf->_smoothingPresentedView = nil;
      return;
    }

    CGAffineTransform original = strongSelf->_smoothingOriginalTransform;
    CGAffineTransform translated =
      CGAffineTransformConcat(original, CGAffineTransformMakeTranslation(0, offset));
    strongPresented.transform = translated;

    UIViewAnimationOptions opts =
      curve | UIViewAnimationOptionBeginFromCurrentState
      | UIViewAnimationOptionOverrideInheritedDuration
      | UIViewAnimationOptionOverrideInheritedCurve
      | UIViewAnimationOptionAllowUserInteraction;

    NSTimeInterval animationDuration = duration > 0 ? duration : kFallbackAnimationDuration;
    [UIView animateWithDuration:animationDuration
                          delay:0
                        options:opts
                     animations:^{
                       strongPresented.transform = original;
                     }
                     completion:^(__unused BOOL finished) {
                       __strong __typeof(weakSelf) innerSelf = weakSelf;
                       if (!innerSelf || innerSelf->_smoothingToken != token) {
                         return;
                       }
                       innerSelf->_isSmoothingKeyboardHide = NO;
                       innerSelf->_smoothingPresentedView = nil;
                     }];
  });
}

- (void)handleKeyboardNotification:(NSNotification *)notification {
  if (_viewController && !_viewController.isTopmostPresentedController) {
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
  BOOL isHideNotification = [notification.name isEqualToString:UIKeyboardWillHideNotification];
  BOOL isKeyboardHiding = isHideNotification || keyboardHeight <= 0;
  BOOL firstResponderWithinSheet = [self isFirstResponderWithinSheet];
  BOOL wasKeyboardVisibleForSheet = _isKeyboardVisibleForSheet || _currentHeight > 0;
  BOOL shouldEmitShow = !isKeyboardHiding
    && keyboardHeight > 0
    && (firstResponderWithinSheet || wasKeyboardVisibleForSheet);
  BOOL shouldEmitHide = isKeyboardHiding
    && (wasKeyboardVisibleForSheet || firstResponderWithinSheet);

  if (!shouldEmitShow && !shouldEmitHide) {
    return;
  }

  // iOS posts UIKeyboardWillChangeFrameNotification and UIKeyboardWillHideNotification
  // for the same dismissal; dedupe within a single runloop tick.
  if (shouldEmitHide) {
    if (_isHandlingHide) {
      return;
    }
    _isHandlingHide = YES;
    __weak __typeof(self) weakSelf = self;
    dispatch_async(dispatch_get_main_queue(), ^{
      __strong __typeof(weakSelf) strongSelf = weakSelf;
      if (strongSelf) {
        strongSelf->_isHandlingHide = NO;
      }
    });

    [self smoothKeyboardHideWithDuration:duration curve:curve];
  }

  _currentHeight = keyboardHeight;
  _isKeyboardVisibleForSheet = !isKeyboardHiding;

  for (id<TrueSheetKeyboardObserverDelegate> delegate in _delegates) {
    if (shouldEmitShow) {
      [delegate keyboardWillShow:keyboardHeight duration:duration curve:curve];
    } else if (shouldEmitHide) {
      [delegate keyboardWillHide:duration curve:curve];
    }
  }
}

@end

#endif
