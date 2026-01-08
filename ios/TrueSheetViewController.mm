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
#import "core/TrueSheetDetentCalculator.h"
#import "core/TrueSheetGrabberView.h"
#import "utils/BlurUtil.h"
#import "utils/GestureUtil.h"
#import "utils/PlatformUtil.h"
#import "utils/WindowUtil.h"

#import <React/RCTLog.h>
#import <React/RCTScrollViewComponentView.h>

@interface TrueSheetViewController ()

@end

@implementation TrueSheetViewController {
  CGFloat _lastPosition;
  NSInteger _pendingDetentIndex;
  BOOL _pendingContentSizeChange;
  BOOL _pendingDetentsChange;

  CADisplayLink *_transitioningTimer;
  UIView *_transitionFakeView;
  BOOL _isDragging;
  BOOL _isTransitioning;
  BOOL _isTrackingPositionFromLayout;

  __weak TrueSheetViewController *_parentSheetController;

  TrueSheetBlurView *_blurView;
  TrueSheetGrabberView *_grabberView;
  TrueSheetDetentCalculator *_detentCalculator;
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
    _detentCalculator = [[TrueSheetDetentCalculator alloc] init];
    _detentCalculator.delegate = self;
  }
  return self;
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - Computed Properties

- (UISheetPresentationController *)sheet {
  return self.sheetPresentationController;
}

- (BOOL)isTopmostPresentedController {
  if (!self.isViewLoaded || self.view.window == nil) {
    return NO;
  }
  return self.presentedViewController == nil;
}

- (UIView *)presentedView {
  return self.sheet.presentedView;
}

- (CGFloat)currentPosition {
  UIView *presentedView = self.presentedView;
  return presentedView ? presentedView.frame.origin.y : 0.0;
}

- (CGFloat)screenHeight {
  return UIScreen.mainScreen.bounds.size.height;
}

- (CGFloat)detentBottomAdjustmentForHeight:(CGFloat)height {
  if ([_insetAdjustment isEqualToString:@"automatic"]) {
    return 0;
  }

  if (UIDevice.currentDevice.userInterfaceIdiom != UIUserInterfaceIdiomPhone) {
    return 0;
  }

  // On iOS 26+, returns 0 for small detents (height <= 150)
  // Floating sheets don't need adjustment
  if (@available(iOS 26.0, *)) {
    if (height <= 150) {
      return 0;
    }
  }

  UIWindow *window = [WindowUtil keyWindow];
  return window ? window.safeAreaInsets.bottom : 0;
}

- (BOOL)isDesignCompatibilityMode {
  if (@available(iOS 26.0, *)) {
    NSNumber *value = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIDesignRequiresCompatibility"];
    return value.boolValue;
  }
  return NO;
}

- (NSInteger)currentDetentIndex {
  UISheetPresentationController *sheet = self.sheet;
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

    if (_pendingContentSizeChange || _pendingDetentsChange) {
      _pendingContentSizeChange = NO;
      _pendingDetentsChange = NO;
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
        [self storeResolvedPositionForIndex:pendingIndex];
        CGFloat detent = [self detentValueForIndex:pendingIndex];
        [self.delegate viewControllerDidChangeDetent:pendingIndex position:self.currentPosition detent:detent];
        [self emitChangePositionDelegateWithPosition:self.currentPosition realtime:NO debug:@"pending detent change"];
      }
    });
  }

  _isTrackingPositionFromLayout = NO;
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
  [_detentCalculator storeResolvedPositionForIndex:index];
}

- (CGFloat)estimatedPositionForIndex:(NSInteger)index {
  return [_detentCalculator estimatedPositionForIndex:index];
}

- (BOOL)findSegmentForPosition:(CGFloat)position outIndex:(NSInteger *)outIndex outProgress:(CGFloat *)outProgress {
  return [_detentCalculator findSegmentForPosition:position outIndex:outIndex outProgress:outProgress];
}

- (CGFloat)interpolatedIndexForPosition:(CGFloat)position {
  return [_detentCalculator interpolatedIndexForPosition:position];
}

- (CGFloat)interpolatedDetentForPosition:(CGFloat)position {
  return [_detentCalculator interpolatedDetentForPosition:position];
}

- (CGFloat)detentValueForIndex:(NSInteger)index {
  return [_detentCalculator detentValueForIndex:index];
}

#pragma mark - Sheet Configuration

- (void)setupSheetDetentsForSizeChange {
  [self.sheet animateChanges:^{
    _pendingContentSizeChange = YES;
    [self setupSheetDetents];
  }];
}

- (void)setupSheetDetentsForDetentsChange {
  _pendingDetentsChange = YES;
  [self setupSheetDetents];
}

- (void)setupSheetDetents {
  UISheetPresentationController *sheet = self.sheet;
  if (!sheet) {
    RCTLogError(@"TrueSheet: sheetPresentationController is nil in setupSheetDetents");
    return;
  }

  NSMutableArray<UISheetPresentationControllerDetent *> *detents = [NSMutableArray array];
  [_detentCalculator clearResolvedPositions];

  CGFloat autoHeight = [self.contentHeight floatValue] + [self.headerHeight floatValue];

  for (NSInteger index = 0; index < self.detents.count; index++) {
    id detent = self.detents[index];
    UISheetPresentationControllerDetent *sheetDetent = [self detentForValue:detent
                                                             withAutoHeight:autoHeight
                                                                    atIndex:index];
    [detents addObject:sheetDetent];
  }

  [_detentCalculator setDetentCount:self.detents.count];
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
  CGFloat bottomAdjustment = [self detentBottomAdjustmentForHeight:height];
  return [UISheetPresentationControllerDetent
    customDetentWithIdentifier:identifier
                      resolver:^CGFloat(id<UISheetPresentationControllerDetentResolutionContext> context) {
                        CGFloat maxDetentValue = context.maximumDetentValue;
                        CGFloat maxValue =
                          self.maxHeight ? fmin(maxDetentValue, [self.maxHeight floatValue]) : maxDetentValue;
                        CGFloat adjustedHeight = height - bottomAdjustment;
                        return fmin(adjustedHeight, maxValue);
                      }];
}

- (UISheetPresentationControllerDetentIdentifier)detentIdentifierForIndex:(NSInteger)index {
  UISheetPresentationController *sheet = self.sheet;
  if (!sheet) {
    RCTLogError(@"TrueSheet: sheetPresentationController is nil in detentIdentifierForIndex");
    return UISheetPresentationControllerDetentIdentifierMedium;
  }

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
  if (!self.sheet) {
    RCTLogError(@"TrueSheet: sheetPresentationController is nil in applyActiveDetent");
    return;
  }

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
    self.sheet.selectedDetentIdentifier = identifier;
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

- (void)setupBackground {
#if RNTS_IPHONE_OS_VERSION_AVAILABLE(26_1)
  BOOL useBackgroundEffect = NO;
  if (@available(iOS 26.1, *)) {
    useBackgroundEffect = !self.isDesignCompatibilityMode;
  }

  // iOS 26.1+: use native backgroundEffect when only backgroundBlur is set (no backgroundColor)
  // Fall back to TrueSheetBlurView when blur intensity is set (not 100%) since
  // sheet.backgroundEffect doesn't support intensity control
  if (@available(iOS 26.1, *)) {
    if (useBackgroundEffect) {
      BOOL hasCustomIntensity = self.blurIntensity && [self.blurIntensity floatValue] < 100;
      if (!self.backgroundColor && self.backgroundBlur && self.backgroundBlur.length > 0) {
        if (hasCustomIntensity) {
          // Clear native effect to allow custom blur view with intensity
          self.sheet.backgroundEffect = [UIColorEffect effectWithColor:[UIColor clearColor]];
        } else {
          UIBlurEffectStyle style = [BlurUtil blurEffectStyleFromString:self.backgroundBlur];
          self.sheet.backgroundEffect = [UIBlurEffect effectWithStyle:style];
          return;
        }
      }
    }
  }
#endif

  NSString *effectiveBackgroundBlur = self.backgroundBlur;
  if (@available(iOS 26.0, *)) {
    // iOS 26+ has default liquid glass effect
  } else if ((!effectiveBackgroundBlur || effectiveBackgroundBlur.length == 0) && !self.backgroundColor) {
    effectiveBackgroundBlur = @"system-material";
  }

  BOOL blurChanged = ![_blurView.backgroundBlur isEqualToString:effectiveBackgroundBlur];

  if (_blurView && blurChanged) {
    [_blurView removeFromSuperview];
    _blurView = nil;
  }

  if (effectiveBackgroundBlur && effectiveBackgroundBlur.length > 0) {
    if (!_blurView) {
      _blurView = [[TrueSheetBlurView alloc] init];
      [_blurView addToView:self.view];
    }
    _blurView.backgroundBlur = effectiveBackgroundBlur;
    _blurView.blurIntensity = self.blurIntensity;
    _blurView.blurInteraction = self.blurInteraction;
    [_blurView applyBlurEffect];
  }

#if RNTS_IPHONE_OS_VERSION_AVAILABLE(26_1)
  if (@available(iOS 26.1, *)) {
    if (useBackgroundEffect && self.backgroundColor) {
      self.sheet.backgroundEffect = [UIColorEffect effectWithColor:self.backgroundColor];
      return;
    }
  }
#endif

  self.view.backgroundColor = self.backgroundColor;
}

- (void)setupGrabber {
  BOOL showGrabber = self.grabber && self.draggable;

  if (self.grabberOptions) {
    self.sheet.prefersGrabberVisible = NO;

    NSDictionary *options = self.grabberOptions;
    _grabberView.grabberWidth = options[@"width"];
    _grabberView.grabberHeight = options[@"height"];
    _grabberView.topMargin = options[@"topMargin"];
    _grabberView.cornerRadius = options[@"cornerRadius"];
    _grabberView.color = options[@"color"];
    _grabberView.adaptive = options[@"adaptive"];
    [_grabberView applyConfiguration];
    _grabberView.hidden = !showGrabber;

    [self.view bringSubviewToFront:_grabberView];
  } else {
    self.sheet.prefersGrabberVisible = showGrabber;
    _grabberView.hidden = YES;
  }
}

- (void)setupSheetProps {
  UISheetPresentationController *sheet = self.sheet;
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
  sheet.prefersScrollingExpandsWhenScrolledToEdge = self.draggable;

  if (self.cornerRadius) {
    sheet.preferredCornerRadius = [self.cornerRadius floatValue];
  } else {
    sheet.preferredCornerRadius = UISheetPresentationControllerAutomaticDimension;
  }

  [self setupBackground];
  [self setupGrabber];
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
