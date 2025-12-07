//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "TrueSheetViewController.h"
#import "TrueSheetContentView.h"
#import "core/TrueSheetBlurView.h"
#import "core/TrueSheetGrabberView.h"
#import "utils/GestureUtil.h"
#import "utils/WindowUtil.h"

#import <React/RCTLog.h>
#import <React/RCTScrollViewComponentView.h>

@interface TrueSheetViewController ()

@end

@implementation TrueSheetViewController {
  CGFloat _lastPosition;
  NSInteger _pendingDetentIndex;
  BOOL _pendingContentSizeChange;

  CADisplayLink *_transitioningTimer;
  UIView *_transitionFakeView;
  BOOL _isDragging;
  BOOL _isTransitioning;
  BOOL _isTrackingPositionFromLayout;

  __weak TrueSheetViewController *_parentSheetController;

  TrueSheetBlurView *_blurView;
  TrueSheetGrabberView *_grabberView;

  NSMutableArray<NSNumber *> *_resolvedDetentPositions;
  BOOL _hasPresentedController;
}

#pragma mark - Initialization

- (instancetype)init {
  if (self = [super initWithNibName:nil bundle:nil]) {
    _detents = @[ @0.5, @1 ];
    _contentHeight = @(0);
    _headerHeight = @(0);
    _grabber = YES;
    _draggable = YES;
    _dimmed = YES;
    _dimmedDetentIndex = @(0);
    _pageSizing = YES;
    _lastPosition = 0;
    _isDragging = NO;
    _isPresented = NO;
    _pendingContentSizeChange = NO;
    _activeDetentIndex = -1;
    _pendingDetentIndex = -1;

    _isTransitioning = NO;
    _transitionFakeView = [UIView new];
    _isTrackingPositionFromLayout = NO;

    _blurInteraction = YES;
    _insetAdjustment = @"automatic";
    _resolvedDetentPositions = [NSMutableArray array];
    _hasPresentedController = NO;
  }
  return self;
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - Computed Properties

- (BOOL)isTopmostPresentedController {
  if (!self.isViewLoaded || self.view.window == nil) {
    return NO;
  }
  return self.presentedViewController == nil;
}

- (UIView *)presentedView {
  return self.sheetPresentationController.presentedView;
}

- (CGFloat)currentPosition {
  UIView *presentedView = self.presentedView;
  return presentedView ? presentedView.frame.origin.y : 0.0;
}

- (CGFloat)screenHeight {
  return UIScreen.mainScreen.bounds.size.height;
}

- (CGFloat)bottomInset {
  UIWindow *window = [WindowUtil keyWindow];
  return window ? window.safeAreaInsets.bottom : 0;
}

- (CGFloat)contentBottomInset {
  return [_insetAdjustment isEqualToString:@"automatic"] ? 0 : self.bottomInset;
}

- (NSInteger)currentDetentIndex {
  UISheetPresentationController *sheet = self.sheetPresentationController;
  if (!sheet)
    return -1;

  UISheetPresentationControllerDetentIdentifier selectedIdentifier = sheet.selectedDetentIdentifier;
  if (!selectedIdentifier)
    return -1;

  NSArray<UISheetPresentationControllerDetent *> *detents = sheet.detents;
  for (NSInteger i = 0; i < detents.count; i++) {
    if (@available(iOS 16.0, *)) {
      if ([detents[i].identifier isEqualToString:selectedIdentifier]) {
        return i;
      }
    } else {
      // iOS 15 only supports medium/large system detents
      if ([selectedIdentifier isEqualToString:UISheetPresentationControllerDetentIdentifierMedium]) {
        return 0;
      } else if ([selectedIdentifier isEqualToString:UISheetPresentationControllerDetentIdentifierLarge]) {
        return detents.count - 1;
      }
    }
  }

  return -1;
}

#pragma mark - View Lifecycle

- (void)viewDidLoad {
  [super viewDidLoad];
  self.view.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;

  _grabberView = [[TrueSheetGrabberView alloc] init];
  _grabberView.hidden = YES;
  [_grabberView addToView:self.view];
}

- (void)viewWillAppear:(BOOL)animated {
  [super viewWillAppear:animated];

  if (!_isPresented) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [self storeResolvedPositionForIndex:self.currentDetentIndex];
    });

    UIViewController *presenter = self.presentingViewController;
    if ([presenter isKindOfClass:[TrueSheetViewController class]]) {
      _parentSheetController = (TrueSheetViewController *)presenter;
      if ([_parentSheetController.delegate respondsToSelector:@selector(viewControllerWillBlur)]) {
        [_parentSheetController.delegate viewControllerWillBlur];
      }
    }

    dispatch_async(dispatch_get_main_queue(), ^{
      if ([self.delegate respondsToSelector:@selector(viewControllerWillPresentAtIndex:position:detent:)]) {
        NSInteger index = self.currentDetentIndex;
        CGFloat position = self.currentPosition;
        CGFloat detent = [self detentValueForIndex:index];

        [self.delegate viewControllerWillPresentAtIndex:index position:position detent:detent];
      }

      if ([self.delegate respondsToSelector:@selector(viewControllerWillFocus)]) {
        [self.delegate viewControllerWillFocus];
      }
    });
  }

  [self setupTransitionTracker];
}

- (void)viewDidAppear:(BOOL)animated {
  [super viewDidAppear:animated];

  if (!_isPresented) {
    if (_parentSheetController) {
      if ([_parentSheetController.delegate respondsToSelector:@selector(viewControllerDidBlur)]) {
        [_parentSheetController.delegate viewControllerDidBlur];
      }
    }

    dispatch_async(dispatch_get_main_queue(), ^{
      if ([self.delegate respondsToSelector:@selector(viewControllerDidPresentAtIndex:position:detent:)]) {
        NSInteger index = [self currentDetentIndex];
        CGFloat detent = [self detentValueForIndex:index];
        [self.delegate viewControllerDidPresentAtIndex:index position:self.currentPosition detent:detent];
      }

      if ([self.delegate respondsToSelector:@selector(viewControllerDidFocus)]) {
        [self.delegate viewControllerDidFocus];
      }

      [self emitChangePositionDelegateWithPosition:self.currentPosition realtime:NO debug:@"did present"];
    });

    [self setupGestureRecognizer];
    _isPresented = YES;
  }
}

- (BOOL)isDismissing {
  return self.presentingViewController == nil || self.isBeingDismissed;
}

- (void)viewWillDisappear:(BOOL)animated {
  [super viewWillDisappear:animated];

  if (self.isDismissing) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if ([self.delegate respondsToSelector:@selector(viewControllerWillBlur)]) {
        [self.delegate viewControllerWillBlur];
      }

      if ([self.delegate respondsToSelector:@selector(viewControllerWillDismiss)]) {
        [self.delegate viewControllerWillDismiss];
      }
    });

    if (_parentSheetController) {
      if ([_parentSheetController.delegate respondsToSelector:@selector(viewControllerWillFocus)]) {
        [_parentSheetController.delegate viewControllerWillFocus];
      }
    }
  }

  [self setupTransitionTracker];
}

- (void)viewDidDisappear:(BOOL)animated {
  [super viewDidDisappear:animated];

  if (self.isDismissing) {
    _isPresented = NO;
    _activeDetentIndex = -1;

    if (_parentSheetController) {
      if ([_parentSheetController.delegate respondsToSelector:@selector(viewControllerDidFocus)]) {
        [_parentSheetController.delegate viewControllerDidFocus];
      }
      _parentSheetController = nil;
    }

    if ([self.delegate respondsToSelector:@selector(viewControllerDidBlur)]) {
      [self.delegate viewControllerDidBlur];
    }

    if ([self.delegate respondsToSelector:@selector(viewControllerDidDismiss)]) {
      [self.delegate viewControllerDidDismiss];
    }
  }
}

- (void)viewWillLayoutSubviews {
  [super viewWillLayoutSubviews];

  if (!_isTransitioning) {
    _isTrackingPositionFromLayout = YES;

    UIViewController *presented = self.presentedViewController;
    BOOL hasPresentedController = presented != nil && !presented.isBeingPresented && !presented.isBeingDismissed;
    BOOL realtime = !hasPresentedController;

    if (_pendingContentSizeChange) {
      _pendingContentSizeChange = NO;
      realtime = NO;
      [self storeResolvedPositionForIndex:self.currentDetentIndex];
    }

    [self emitChangePositionDelegateWithPosition:self.currentPosition realtime:realtime debug:@"layout"];
  }
}

- (void)viewDidLayoutSubviews {
  [super viewDidLayoutSubviews];

  if ([self.delegate respondsToSelector:@selector(viewControllerDidChangeSize:)]) {
    [self.delegate viewControllerDidChangeSize:self.view.frame.size];
  }

  if (_pendingDetentIndex >= 0) {
    NSInteger pendingIndex = _pendingDetentIndex;
    _pendingDetentIndex = -1;

    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
      if ([self.delegate respondsToSelector:@selector(viewControllerDidChangeDetent:position:detent:)]) {
        CGFloat detent = [self detentValueForIndex:pendingIndex];
        [self.delegate viewControllerDidChangeDetent:pendingIndex position:self.currentPosition detent:detent];
        [self emitChangePositionDelegateWithPosition:self.currentPosition realtime:NO debug:@"pending detent change"];
      }
    });
  }

  _isTrackingPositionFromLayout = NO;
}

#pragma mark - Presentation Tracking (RN Screens)

- (void)presentViewController:(UIViewController *)viewControllerToPresent
                     animated:(BOOL)flag
                   completion:(void (^)(void))completion {
  BOOL isExternalController = ![viewControllerToPresent isKindOfClass:[TrueSheetViewController class]];

  if (isExternalController && !_hasPresentedController) {
    _hasPresentedController = YES;
    if ([self.delegate respondsToSelector:@selector(viewControllerWillBlur)]) {
      [self.delegate viewControllerWillBlur];
    }
  }

  [super presentViewController:viewControllerToPresent
                      animated:flag
                    completion:^{
                      if (isExternalController && self->_hasPresentedController) {
                        if ([self.delegate respondsToSelector:@selector(viewControllerDidBlur)]) {
                          [self.delegate viewControllerDidBlur];
                        }
                      }
                      if (completion) {
                        completion();
                      }
                    }];
}

- (void)dismissViewControllerAnimated:(BOOL)flag completion:(void (^)(void))completion {
  UIViewController *presented = self.presentedViewController;
  BOOL isExternalController = presented && ![presented isKindOfClass:[TrueSheetViewController class]];

  if (isExternalController && _hasPresentedController) {
    if ([self.delegate respondsToSelector:@selector(viewControllerWillFocus)]) {
      [self.delegate viewControllerWillFocus];
    }
  }

  [super dismissViewControllerAnimated:flag
                            completion:^{
                              if (isExternalController && self->_hasPresentedController) {
                                self->_hasPresentedController = NO;
                                if ([self.delegate respondsToSelector:@selector(viewControllerDidFocus)]) {
                                  [self.delegate viewControllerDidFocus];
                                }
                              }
                              if (completion) {
                                completion();
                              }
                            }];
}

#pragma mark - Position & Gesture Handling

- (TrueSheetContentView *)findContentView:(UIView *)view {
  if ([view isKindOfClass:[TrueSheetContentView class]]) {
    return (TrueSheetContentView *)view;
  }

  for (UIView *subview in view.subviews) {
    TrueSheetContentView *found = [self findContentView:subview];
    if (found) {
      return found;
    }
  }

  return nil;
}

- (void)setupGestureRecognizer {
  UIView *presentedView = self.presentedView;
  if (!presentedView)
    return;

  if (!self.draggable) {
    [GestureUtil setPanGesturesEnabled:NO forView:presentedView];

    TrueSheetContentView *contentView = [self findContentView:presentedView];
    if (contentView) {
      RCTScrollViewComponentView *scrollViewComponent = [contentView findScrollView:nil];
      if (scrollViewComponent && scrollViewComponent.scrollView) {
        [GestureUtil setPanGesturesEnabled:NO forView:scrollViewComponent.scrollView];
      }
    }
    return;
  }

  [GestureUtil attachPanGestureHandler:presentedView target:self selector:@selector(handlePanGesture:)];

  TrueSheetContentView *contentView = [self findContentView:presentedView];
  if (contentView) {
    RCTScrollViewComponentView *scrollViewComponent = [contentView findScrollView:nil];
    if (scrollViewComponent && scrollViewComponent.scrollView) {
      [GestureUtil attachPanGestureHandler:scrollViewComponent.scrollView
                                    target:self
                                  selector:@selector(handlePanGesture:)];
    }
  }
}

- (void)setupDraggable {
  UIView *presentedView = self.presentedView;
  if (!presentedView)
    return;

  [GestureUtil setPanGesturesEnabled:self.draggable forView:presentedView];

  TrueSheetContentView *contentView = [self findContentView:presentedView];
  if (contentView) {
    RCTScrollViewComponentView *scrollViewComponent = [contentView findScrollView:nil];
    if (scrollViewComponent && scrollViewComponent.scrollView) {
      [GestureUtil setPanGesturesEnabled:self.draggable forView:scrollViewComponent.scrollView];
    }
  }
}

- (void)handlePanGesture:(UIPanGestureRecognizer *)gesture {
  NSInteger index = self.currentDetentIndex;
  CGFloat detent = [self detentValueForIndex:index];

  if ([self.delegate respondsToSelector:@selector(viewControllerDidDrag:index:position:detent:)]) {
    [self.delegate viewControllerDidDrag:gesture.state index:index position:self.currentPosition detent:detent];
  }

  switch (gesture.state) {
    case UIGestureRecognizerStateBegan:
      _isDragging = YES;
      break;
    case UIGestureRecognizerStateChanged:
      if (!_isTrackingPositionFromLayout) {
        [self emitChangePositionDelegateWithPosition:self.currentPosition realtime:YES debug:@"drag change"];
      }
      break;
    case UIGestureRecognizerStateEnded:
    case UIGestureRecognizerStateCancelled: {
      if (!_isTransitioning) {
        dispatch_async(dispatch_get_main_queue(), ^{
          [self storeResolvedPositionForIndex:self.currentDetentIndex];
          [self emitChangePositionDelegateWithPosition:self.currentPosition realtime:NO debug:@"drag end"];
        });
      }

      _isDragging = NO;
      break;
    }
    default:
      break;
  }
}

- (void)setupTransitionTracker {
  if (!self.transitionCoordinator)
    return;

  _isTransitioning = YES;

  CGRect dismissedFrame = CGRectMake(0, self.screenHeight, 0, 0);
  CGRect presentedFrame = CGRectMake(0, self.currentPosition, 0, 0);

  _transitionFakeView.frame = self.isDismissing ? presentedFrame : dismissedFrame;
  [self storeResolvedPositionForIndex:self.currentDetentIndex];

  auto animation = ^(id<UIViewControllerTransitionCoordinatorContext> _Nonnull context) {
    [[context containerView] addSubview:self->_transitionFakeView];
    self->_transitionFakeView.frame = self.isDismissing ? dismissedFrame : presentedFrame;

    self->_transitioningTimer = [CADisplayLink displayLinkWithTarget:self selector:@selector(handleTransitionTracker)];
    [self->_transitioningTimer addToRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
  };

  [self.transitionCoordinator
    animateAlongsideTransition:animation
                    completion:^(id<UIViewControllerTransitionCoordinatorContext> _Nonnull context) {
                      [self->_transitioningTimer setPaused:YES];
                      [self->_transitioningTimer invalidate];
                      [self->_transitionFakeView removeFromSuperview];
                      self->_isTransitioning = NO;
                    }];
}

- (void)handleTransitionTracker {
  if (!_isDragging && _transitionFakeView.layer) {
    CALayer *layer = _transitionFakeView.layer;
    CGFloat layerPosition = layer.presentationLayer.frame.origin.y;

    if (self.currentPosition >= self.screenHeight) {
      CGFloat position = fmax(_lastPosition, layerPosition);
      [self emitChangePositionDelegateWithPosition:position realtime:YES debug:@"transition out"];
    } else {
      CGFloat position = fmax(self.currentPosition, layerPosition);
      [self emitChangePositionDelegateWithPosition:position realtime:YES debug:@"transition in"];
    }
  }
}

- (void)emitChangePositionDelegateWithPosition:(CGFloat)position realtime:(BOOL)realtime debug:(NSString *)debug {
  UIViewController *presented = self.presentedViewController;
  if (presented) {
    UIModalPresentationStyle style = presented.modalPresentationStyle;
    if (style == UIModalPresentationFullScreen || style == UIModalPresentationOverFullScreen ||
        style == UIModalPresentationCurrentContext || style == UIModalPresentationOverCurrentContext) {
      return;
    }
  }

  if (fabs(_lastPosition - position) > 0.01) {
    _lastPosition = position;

    CGFloat index = [self interpolatedIndexForPosition:position];
    CGFloat detent = [self interpolatedDetentForPosition:position];
    if ([self.delegate respondsToSelector:@selector(viewControllerDidChangePosition:position:detent:realtime:)]) {
      [self.delegate viewControllerDidChangePosition:index position:position detent:detent realtime:realtime];
    }
  }
}

- (void)storeResolvedPositionForIndex:(NSInteger)index {
  if (index >= 0 && index < (NSInteger)_resolvedDetentPositions.count) {
    _resolvedDetentPositions[index] = @(self.currentPosition);
  }
}

- (CGFloat)estimatedPositionForIndex:(NSInteger)index {
  if (index < 0 || index >= (NSInteger)_resolvedDetentPositions.count)
    return 0;

  CGFloat storedPos = [_resolvedDetentPositions[index] doubleValue];
  if (storedPos > 0) {
    return storedPos;
  }

  CGFloat detentValue = [self detentValueForIndex:index];
  CGFloat basePosition = self.screenHeight - (detentValue * self.screenHeight);

  for (NSInteger i = 0; i < (NSInteger)_resolvedDetentPositions.count; i++) {
    CGFloat pos = [_resolvedDetentPositions[i] doubleValue];
    if (pos > 0) {
      CGFloat knownDetent = [self detentValueForIndex:i];
      CGFloat expectedPos = self.screenHeight - (knownDetent * self.screenHeight);
      CGFloat offset = pos - expectedPos;
      return basePosition + offset;
    }
  }

  return basePosition;
}

- (BOOL)findSegmentForPosition:(CGFloat)position outIndex:(NSInteger *)outIndex outProgress:(CGFloat *)outProgress {
  NSInteger count = _resolvedDetentPositions.count;
  if (count == 0) {
    *outIndex = -1;
    *outProgress = 0;
    return NO;
  }

  if (count == 1) {
    *outIndex = 0;
    *outProgress = 0;
    return NO;
  }

  CGFloat firstPos = [self estimatedPositionForIndex:0];
  CGFloat lastPos = [self estimatedPositionForIndex:count - 1];

  if (position > firstPos) {
    CGFloat range = self.screenHeight - firstPos;
    *outIndex = -1;
    *outProgress = range > 0 ? (position - firstPos) / range : 0;
    return NO;
  }

  if (position < lastPos) {
    *outIndex = count - 1;
    *outProgress = 0;
    return NO;
  }

  for (NSInteger i = 0; i < count - 1; i++) {
    CGFloat pos = [self estimatedPositionForIndex:i];
    CGFloat nextPos = [self estimatedPositionForIndex:i + 1];

    if (position <= pos && position >= nextPos) {
      CGFloat range = pos - nextPos;
      *outIndex = i;
      *outProgress = range > 0 ? (pos - position) / range : 0;
      return YES;
    }
  }

  *outIndex = count - 1;
  *outProgress = 0;
  return NO;
}

- (CGFloat)interpolatedIndexForPosition:(CGFloat)position {
  NSInteger index;
  CGFloat progress;
  BOOL found = [self findSegmentForPosition:position outIndex:&index outProgress:&progress];

  if (!found) {
    if (index == -1) {
      return -progress;
    }
    return index;
  }

  return index + fmax(0, fmin(1, progress));
}

- (CGFloat)interpolatedDetentForPosition:(CGFloat)position {
  NSInteger index;
  CGFloat progress;
  BOOL found = [self findSegmentForPosition:position outIndex:&index outProgress:&progress];

  if (!found) {
    if (index == -1) {
      CGFloat firstDetent = [self detentValueForIndex:0];
      return fmax(0, firstDetent * (1 - progress));
    }
    return [self detentValueForIndex:index];
  }

  CGFloat detent = [self detentValueForIndex:index];
  CGFloat nextDetent = [self detentValueForIndex:index + 1];
  return detent + progress * (nextDetent - detent);
}

- (CGFloat)detentValueForIndex:(NSInteger)index {
  if (index >= 0 && index < (NSInteger)_detents.count) {
    CGFloat value = [_detents[index] doubleValue];
    if (value == -1) {
      CGFloat autoHeight = [self.contentHeight floatValue] + [self.headerHeight floatValue];
      return autoHeight / self.screenHeight;
    }
    return value;
  }
  return 0;
}

#pragma mark - Sheet Configuration

- (void)setupSheetDetentsForSizeChange {
  _pendingContentSizeChange = YES;
  [self setupSheetDetents];
}

- (void)setupSheetDetents {
  UISheetPresentationController *sheet = self.sheetPresentationController;
  if (!sheet)
    return;

  NSMutableArray<UISheetPresentationControllerDetent *> *detents = [NSMutableArray array];
  [_resolvedDetentPositions removeAllObjects];

  CGFloat autoHeight = [self.contentHeight floatValue] + [self.headerHeight floatValue];

  for (NSInteger index = 0; index < self.detents.count; index++) {
    id detent = self.detents[index];
    UISheetPresentationControllerDetent *sheetDetent = [self detentForValue:detent
                                                             withAutoHeight:autoHeight
                                                                    atIndex:index];
    [detents addObject:sheetDetent];
    [_resolvedDetentPositions addObject:@(0)];
  }

  sheet.detents = detents;

  if (self.dimmed && [self.dimmedDetentIndex integerValue] == 0) {
    sheet.largestUndimmedDetentIdentifier = nil;
  } else {
    sheet.largestUndimmedDetentIdentifier = UISheetPresentationControllerDetentIdentifierLarge;

    if (@available(iOS 16.0, *)) {
      if (self.dimmed && self.dimmedDetentIndex) {
        NSInteger dimmedIdx = [self.dimmedDetentIndex integerValue];
        if (dimmedIdx > 0 && dimmedIdx - 1 < sheet.detents.count) {
          sheet.largestUndimmedDetentIdentifier = sheet.detents[dimmedIdx - 1].identifier;
        } else if (sheet.detents.lastObject) {
          sheet.largestUndimmedDetentIdentifier = sheet.detents.lastObject.identifier;
        }
      } else if (sheet.detents.lastObject) {
        sheet.largestUndimmedDetentIdentifier = sheet.detents.lastObject.identifier;
      }
    }
  }
}

- (UISheetPresentationControllerDetent *)detentForValue:(id)detent
                                         withAutoHeight:(CGFloat)autoHeight
                                                atIndex:(NSInteger)index {
  if (![detent isKindOfClass:[NSNumber class]]) {
    return [UISheetPresentationControllerDetent mediumDetent];
  }

  CGFloat value = [detent doubleValue];

  if (value == -1) {
    if (@available(iOS 16.0, *)) {
      return [self customDetentWithIdentifier:@"custom-auto" height:autoHeight];
    } else {
      return [UISheetPresentationControllerDetent mediumDetent];
    }
  }

  if (value <= 0 || value > 1) {
    RCTLogError(@"TrueSheet: detent fraction (%f) must be between 0 and 1", value);
    return [UISheetPresentationControllerDetent mediumDetent];
  }

  if (@available(iOS 16.0, *)) {
    NSString *detentId = [NSString stringWithFormat:@"custom-%f", value];
    CGFloat sheetHeight = value * self.screenHeight;
    return [self customDetentWithIdentifier:detentId height:sheetHeight];
  } else if (value >= 0.5) {
    return [UISheetPresentationControllerDetent largeDetent];
  } else {
    return [UISheetPresentationControllerDetent mediumDetent];
  }
}

- (UISheetPresentationControllerDetent *)customDetentWithIdentifier:(NSString *)identifier
                                                             height:(CGFloat)height API_AVAILABLE(ios(16.0)) {
  CGFloat bottomInset = self.contentBottomInset;
  return [UISheetPresentationControllerDetent
    customDetentWithIdentifier:identifier
                      resolver:^CGFloat(id<UISheetPresentationControllerDetentResolutionContext> context) {
                        CGFloat maxDetentValue = context.maximumDetentValue;
                        CGFloat maxValue =
                          self.maxHeight ? fmin(maxDetentValue, [self.maxHeight floatValue]) : maxDetentValue;
                        CGFloat adjustedHeight = height - bottomInset;
                        return fmin(adjustedHeight, maxValue);
                      }];
}

- (UISheetPresentationControllerDetentIdentifier)detentIdentifierForIndex:(NSInteger)index {
  UISheetPresentationController *sheet = self.sheetPresentationController;
  if (!sheet)
    return UISheetPresentationControllerDetentIdentifierMedium;

  UISheetPresentationControllerDetentIdentifier identifier = UISheetPresentationControllerDetentIdentifierMedium;
  if (index >= 0 && index < (NSInteger)sheet.detents.count) {
    UISheetPresentationControllerDetent *detent = sheet.detents[index];
    if (@available(iOS 16.0, *)) {
      identifier = detent.identifier;
    } else {
      if (detent == [UISheetPresentationControllerDetent largeDetent]) {
        identifier = UISheetPresentationControllerDetentIdentifierLarge;
      }
    }
  }

  return identifier;
}

- (void)applyActiveDetent {
  UISheetPresentationController *sheet = self.sheetPresentationController;
  if (!sheet)
    return;

  NSInteger detentCount = _detents.count;
  if (detentCount == 0)
    return;

  NSInteger clampedIndex = _activeDetentIndex;
  if (clampedIndex < 0) {
    clampedIndex = 0;
  } else if (clampedIndex >= detentCount) {
    clampedIndex = detentCount - 1;
  }

  if (clampedIndex != _activeDetentIndex) {
    _activeDetentIndex = clampedIndex;
  }

  UISheetPresentationControllerDetentIdentifier identifier = [self detentIdentifierForIndex:clampedIndex];
  if (identifier) {
    sheet.selectedDetentIdentifier = identifier;
  }
}

- (void)setupActiveDetentWithIndex:(NSInteger)index {
  _activeDetentIndex = index;
  [self applyActiveDetent];
}

- (void)resizeToDetentIndex:(NSInteger)index {
  if (index == _activeDetentIndex) {
    return;
  }

  _pendingDetentIndex = index;
  _activeDetentIndex = index;
  [self applyActiveDetent];
}

- (void)setupSheetProps {
  UISheetPresentationController *sheet = self.sheetPresentationController;
  if (!sheet) {
    RCTLogWarn(
      @"TrueSheet: No sheet presentation controller available. Ensure the view controller is presented modally.");
    return;
  }

  sheet.delegate = self;

  if (@available(iOS 17.0, *)) {
    sheet.prefersPageSizing = self.pageSizing;
  }

  sheet.prefersEdgeAttachedInCompactHeight = YES;

  if (self.cornerRadius) {
    sheet.preferredCornerRadius = [self.cornerRadius floatValue];
  } else {
    sheet.preferredCornerRadius = UISheetPresentationControllerAutomaticDimension;
  }

  self.view.backgroundColor = self.backgroundColor;

  BOOL blurTintChanged = ![_blurView.blurTint isEqualToString:self.blurTint];

  if (_blurView && blurTintChanged) {
    [_blurView removeFromSuperview];
    _blurView = nil;
  }

  if (self.blurTint && self.blurTint.length > 0) {
    if (!_blurView) {
      _blurView = [[TrueSheetBlurView alloc] init];
      [_blurView addToView:self.view];
    }
    _blurView.blurTint = self.blurTint;
    _blurView.blurIntensity = self.blurIntensity;
    _blurView.blurInteraction = self.blurInteraction;
    [_blurView applyBlurEffect];
  }

  BOOL showGrabber = self.grabber && self.draggable;

  if (self.grabberOptions) {
    sheet.prefersGrabberVisible = NO;

    NSDictionary *options = self.grabberOptions;
    _grabberView.grabberWidth = options[@"width"];
    _grabberView.grabberHeight = options[@"height"];
    _grabberView.topMargin = options[@"topMargin"];
    _grabberView.cornerRadius = options[@"cornerRadius"];
    _grabberView.color = options[@"color"];
    [_grabberView applyConfiguration];
    _grabberView.hidden = !showGrabber;
  } else {
    sheet.prefersGrabberVisible = showGrabber;
    _grabberView.hidden = YES;
  }
}

#pragma mark - UISheetPresentationControllerDelegate

- (void)sheetPresentationControllerDidChangeSelectedDetentIdentifier:
  (UISheetPresentationController *)sheetPresentationController {
  if ([self.delegate respondsToSelector:@selector(viewControllerDidChangeDetent:position:detent:)]) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSInteger index = self.currentDetentIndex;
      if (index >= 0) {
        CGFloat detent = [self detentValueForIndex:index];
        [self.delegate viewControllerDidChangeDetent:index position:self.currentPosition detent:detent];
      }
    });
  }
}

#pragma mark - RNSDismissibleModalProtocol

#if RNS_DISMISSIBLE_MODAL_PROTOCOL_AVAILABLE
- (BOOL)isDismissible {
  return NO;
}

- (UIViewController *)newPresentingViewController {
  UIViewController *topmost = self;
  while (topmost.presentedViewController != nil && !topmost.presentedViewController.isBeingDismissed &&
         [topmost.presentedViewController isKindOfClass:[TrueSheetViewController class]]) {
    topmost = topmost.presentedViewController;
  }
  return topmost;
}
#endif

@end
