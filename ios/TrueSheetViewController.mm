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
#import "utils/GestureUtil.h"
#import "utils/WindowUtil.h"

#import <React/RCTLog.h>
#import <React/RCTScrollViewComponentView.h>

@interface TrueSheetViewController ()

@end

@implementation TrueSheetViewController {
  CGFloat _lastPosition;
  BOOL _isTransitioning;
  BOOL _isDragging;
  NSInteger _pendingDetentIndex;

  // Hidden view used to track position during native transition animations
  UIView *_fakeTransitionView;
  CADisplayLink *_displayLink;

  // Reference to parent TrueSheetViewController (if presented from another sheet)
  __weak TrueSheetViewController *_parentSheetController;

  // Blur effect view
  TrueSheetBlurView *_blurView;

  // Resolved detent positions (Y coordinate when sheet rests at each detent)
  NSMutableArray<NSNumber *> *_resolvedDetentPositions;
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
    _isTransitioning = NO;
    _isDragging = NO;
    _isPresented = NO;
    _activeDetentIndex = -1;
    _pendingDetentIndex = -1;

    _fakeTransitionView = [[UIView alloc] init];
    _fakeTransitionView.hidden = YES;
    _fakeTransitionView.userInteractionEnabled = NO;

    _blurInteraction = YES;
    _resolvedDetentPositions = [NSMutableArray array];
  }
  return self;
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];

  if (_displayLink) {
    [_displayLink invalidate];
    _displayLink = nil;
  }
}

#pragma mark - Computed Properties

- (BOOL)isTopmostPresentedController {
  if (!self.isViewLoaded || self.view.window == nil) {
    return NO;
  }
  return self.presentedViewController == nil;
}

- (BOOL)isActiveAndVisible {
  return self.isViewLoaded && self.view.window != nil && !self.isBeingDismissed;
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
}

- (void)viewWillAppear:(BOOL)animated {
  [super viewWillAppear:animated];

  // Only trigger on initial presentation, not repositioning
  if (!_isPresented) {
    // Capture parent sheet reference if presented from another TrueSheet
    UIViewController *presenter = self.presentingViewController;
    if ([presenter isKindOfClass:[TrueSheetViewController class]]) {
      _parentSheetController = (TrueSheetViewController *)presenter;
      // Notify parent that it is about to lose focus
      if ([_parentSheetController.delegate respondsToSelector:@selector(viewControllerWillBlur)]) {
        [_parentSheetController.delegate viewControllerWillBlur];
      }
    }

    if ([self.delegate respondsToSelector:@selector(viewControllerWillPresentAtIndex:position:detent:)]) {
      dispatch_async(dispatch_get_main_queue(), ^{
        NSInteger index = [self currentDetentIndex];
        CGFloat position = self.currentPosition;
        CGFloat detent = [self detentValueForIndex:index];

        // Store the target position for the initial detent so interpolation works during animation
        if (index >= 0 && index < (NSInteger)self->_resolvedDetentPositions.count) {
          self->_resolvedDetentPositions[index] = @(position);
        }

        [self.delegate viewControllerWillPresentAtIndex:index position:position detent:detent];
      });
    }
    [self setupTransitionPositionTracking];
  }
}

- (void)viewDidAppear:(BOOL)animated {
  [super viewDidAppear:animated];

  if (!_isPresented) {
    // Notify parent that it has lost focus (after the child sheet appeared)
    if (_parentSheetController) {
      if ([_parentSheetController.delegate respondsToSelector:@selector(viewControllerDidBlur)]) {
        [_parentSheetController.delegate viewControllerDidBlur];
      }
    }

    if ([self.delegate respondsToSelector:@selector(viewControllerDidPresentAtIndex:position:detent:)]) {
      dispatch_async(dispatch_get_main_queue(), ^{
        NSInteger index = [self currentDetentIndex];
        CGFloat detent = [self detentValueForIndex:index];
        [self.delegate viewControllerDidPresentAtIndex:index position:self.currentPosition detent:detent];
      });
    }
    [self setupGestureRecognizer];
    _isPresented = YES;
  }
}

- (void)viewWillDisappear:(BOOL)animated {
  [super viewWillDisappear:animated];

  BOOL isActuallyDismissing = self.presentingViewController == nil || self.isBeingDismissed;

  if (isActuallyDismissing) {
    // Notify the parent sheet (if any) that it is about to regain focus
    if (_parentSheetController) {
      if ([_parentSheetController.delegate respondsToSelector:@selector(viewControllerWillFocus)]) {
        [_parentSheetController.delegate viewControllerWillFocus];
      }
    }

    if ([self.delegate respondsToSelector:@selector(viewControllerWillDismiss)]) {
      [self.delegate viewControllerWillDismiss];
    }
  }

  [self setupTransitionPositionTracking];
}

- (void)viewDidDisappear:(BOOL)animated {
  [super viewDidDisappear:animated];

  // Only dispatch didDismiss when actually dismissing (not when another modal is presented on top)
  BOOL isActuallyDismissing = self.presentingViewController == nil || self.isBeingDismissed;

  if (isActuallyDismissing) {
    // Notify the parent sheet (if any) that it regained focus
    if (_parentSheetController) {
      if ([_parentSheetController.delegate respondsToSelector:@selector(viewControllerDidFocus)]) {
        [_parentSheetController.delegate viewControllerDidFocus];
      }
      _parentSheetController = nil;
    }

    if ([self.delegate respondsToSelector:@selector(viewControllerDidDismiss)]) {
      [self.delegate viewControllerDidDismiss];
    }
  }

  if (isActuallyDismissing) {
    _isPresented = NO;
    _activeDetentIndex = -1;
  }
}

- (void)viewDidLayoutSubviews {
  [super viewDidLayoutSubviews];

  if ([self.delegate respondsToSelector:@selector(viewControllerDidChangeSize:)]) {
    [self.delegate viewControllerDidChangeSize:self.view.frame.size];
  }

  if (!_isTransitioning && !_isDragging && self.isActiveAndVisible) {
    dispatch_async(dispatch_get_main_queue(), ^{
      // Update stored position for current detent (handles content size changes)
      NSInteger index = [self currentDetentIndex];
      if (index >= 0 && index < (NSInteger)self->_resolvedDetentPositions.count) {
        self->_resolvedDetentPositions[index] = @(self.currentPosition);
      }

      [self emitChangePositionDelegateWithPosition:self.currentPosition realtime:NO];
    });

    // Emit pending detent change after programmatic resize settles
    if (_pendingDetentIndex >= 0) {
      NSInteger pendingIndex = _pendingDetentIndex;
      _pendingDetentIndex = -1;

      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        if ([self.delegate respondsToSelector:@selector(viewControllerDidChangeDetent:position:detent:)]) {
          CGFloat detent = [self detentValueForIndex:pendingIndex];
          [self.delegate viewControllerDidChangeDetent:pendingIndex position:self.currentPosition detent:detent];
        }
      });
    }
  }
}

#pragma mark - Gesture Handling

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

  // Disable pan gestures if draggable is NO
  if (!self.draggable) {
    [GestureUtil setPanGesturesEnabled:NO forView:presentedView];

    // Also disable ScrollView's pan gesture if present
    TrueSheetContentView *contentView = [self findContentView:presentedView];
    if (contentView) {
      RCTScrollViewComponentView *scrollViewComponent = [contentView findScrollView:nil];
      if (scrollViewComponent && scrollViewComponent.scrollView) {
        [GestureUtil setPanGesturesEnabled:NO forView:scrollViewComponent.scrollView];
      }
    }
    return;
  }

  // Attach to presented view's pan gesture (sheet's drag gesture from UIKit)
  [GestureUtil attachPanGestureHandler:presentedView target:self selector:@selector(handlePanGesture:)];

  // Also attach to ScrollView's pan gesture if present
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

- (void)updateDraggable {
  UIView *presentedView = self.presentedView;
  if (!presentedView)
    return;

  [GestureUtil setPanGesturesEnabled:self.draggable forView:presentedView];

  // Also update ScrollView's pan gesture if present
  TrueSheetContentView *contentView = [self findContentView:presentedView];
  if (contentView) {
    RCTScrollViewComponentView *scrollViewComponent = [contentView findScrollView:nil];
    if (scrollViewComponent && scrollViewComponent.scrollView) {
      [GestureUtil setPanGesturesEnabled:self.draggable forView:scrollViewComponent.scrollView];
    }
  }
}

- (void)handlePanGesture:(UIPanGestureRecognizer *)gesture {
  NSInteger index = [self currentDetentIndex];
  CGFloat detent = [self detentValueForIndex:index];

  if ([self.delegate respondsToSelector:@selector(viewControllerDidDrag:index:position:detent:)]) {
    [self.delegate viewControllerDidDrag:gesture.state index:index position:self.currentPosition detent:detent];
  }

  switch (gesture.state) {
    case UIGestureRecognizerStateBegan:
      _isDragging = YES;
      break;
    case UIGestureRecognizerStateChanged:
      [self emitChangePositionDelegateWithPosition:self.currentPosition realtime:YES];
      break;
    case UIGestureRecognizerStateEnded:
    case UIGestureRecognizerStateCancelled: {
      _isDragging = NO;
      dispatch_async(dispatch_get_main_queue(), ^{
        [self emitChangePositionDelegateWithPosition:self.currentPosition realtime:NO];
      });
      break;
    }
    default:
      break;
  }
}

#pragma mark - Position Tracking

- (void)emitChangePositionDelegateWithPosition:(CGFloat)position realtime:(BOOL)realtime {
  // Use epsilon comparison to avoid missing updates due to floating point precision
  if (fabs(_lastPosition - position) > 0.01) {
    _lastPosition = position;

    CGFloat index = [self interpolatedIndexForPosition:position];
    CGFloat detent = [self interpolatedDetentForPosition:position];
    if ([self.delegate respondsToSelector:@selector(viewControllerDidChangePosition:position:detent:realtime:)]) {
      [self.delegate viewControllerDidChangePosition:index position:position detent:detent realtime:realtime];
    }
  }
}

/// Returns the estimated Y position for a detent index, using stored positions when available
- (CGFloat)estimatedPositionForIndex:(NSInteger)index {
  if (index < 0 || index >= (NSInteger)_resolvedDetentPositions.count)
    return 0;

  CGFloat storedPos = [_resolvedDetentPositions[index] doubleValue];
  if (storedPos > 0)
    return storedPos;

  // Estimate based on detent value and known offset from first resolved position
  CGFloat detentValue = [self detentValueForIndex:index];
  CGFloat basePosition = self.screenHeight - (detentValue * self.screenHeight);

  // Find a resolved position to calculate offset
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

/// Finds the segment containing the given position and returns the lower index and progress within that segment.
/// Returns YES if a segment was found, NO otherwise. When NO, `outIndex` contains the boundary index.
- (BOOL)findSegmentForPosition:(CGFloat)position
                      outIndex:(NSInteger *)outIndex
                   outProgress:(CGFloat *)outProgress {
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

  // Below first detent (position > firstPos means sheet is smaller)
  if (position > firstPos) {
    CGFloat range = self.screenHeight - firstPos;
    *outIndex = -1;
    *outProgress = range > 0 ? (position - firstPos) / range : 0;
    return NO;
  }

  // Above last detent
  if (position < lastPos) {
    *outIndex = count - 1;
    *outProgress = 0;
    return NO;
  }

  // Find segment (positions decrease as index increases)
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
      // Below first detent - return negative progress
      return -progress;
    }
    // At or beyond boundary
    return index;
  }

  // Within a segment - interpolate
  return index + fmax(0, fmin(1, progress));
}

- (CGFloat)interpolatedDetentForPosition:(CGFloat)position {
  NSInteger index;
  CGFloat progress;
  BOOL found = [self findSegmentForPosition:position outIndex:&index outProgress:&progress];

  if (!found) {
    if (index == -1) {
      // Below first detent
      CGFloat firstDetent = [self detentValueForIndex:0];
      return fmax(0, firstDetent * (1 - progress));
    }
    // At or beyond boundary
    return [self detentValueForIndex:index];
  }

  // Within a segment - interpolate between detent values
  CGFloat detent = [self detentValueForIndex:index];
  CGFloat nextDetent = [self detentValueForIndex:index + 1];
  return detent + progress * (nextDetent - detent);
}

- (CGFloat)detentValueForIndex:(NSInteger)index {
  if (index >= 0 && index < (NSInteger)_detents.count) {
    CGFloat value = [_detents[index] doubleValue];
    // For auto (-1), calculate actual fraction from content + header height
    if (value == -1) {
      CGFloat autoHeight = [self.contentHeight floatValue] + [self.headerHeight floatValue];
      return autoHeight / self.screenHeight;
    }
    return value;
  }
  return 0;
}

/**
 * Sets up position tracking during view controller transitions using a fake view.
 *
 * This uses a hidden "fake" view added to the container that animates alongside
 * the presented view. By observing the presentation layer, we can track smooth
 * position changes during native transition animations.
 */
- (void)setupTransitionPositionTracking {
  if (self.transitionCoordinator == nil)
    return;

  _isTransitioning = YES;

  UIView *containerView = self.sheetPresentationController.containerView;
  UIView *presentedView = self.presentedView;

  if (!containerView || !presentedView)
    return;

  CGRect frame = presentedView.frame;
  BOOL isPresenting = self.isBeingPresented;

  // Set initial position: presenting starts from bottom, dismissing from current
  frame.origin.y = isPresenting ? self.screenHeight : presentedView.frame.origin.y;
  _fakeTransitionView.frame = frame;

  auto animation = ^(id<UIViewControllerTransitionCoordinatorContext> _Nonnull context) {
    [[context containerView] addSubview:self->_fakeTransitionView];

    CGRect finalFrame = presentedView.frame;
    finalFrame.origin.y = presentedView.frame.origin.y;
    self->_fakeTransitionView.frame = finalFrame;

    // Track position at screen refresh rate via display link
    self->_displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(trackTransitionPosition:)];
    [self->_displayLink addToRunLoop:[NSRunLoop currentRunLoop] forMode:NSRunLoopCommonModes];
  };

  [self.transitionCoordinator
    animateAlongsideTransition:animation
                    completion:^(id<UIViewControllerTransitionCoordinatorContext> _Nonnull context) {
                      [self->_displayLink invalidate];
                      self->_displayLink = nil;
                      [self->_fakeTransitionView removeFromSuperview];
                      self->_isTransitioning = NO;
                    }];
}

- (void)trackTransitionPosition:(CADisplayLink *)displayLink {
  UIView *presentedView = self.presentedView;

  if (_isDragging || !_fakeTransitionView || !presentedView)
    return;

  // Presentation layer contains in-flight animated values (not final/target values)
  CALayer *presentationLayer = _fakeTransitionView.layer.presentationLayer;

  if (presentationLayer) {
    CGFloat transitioningPosition = presentationLayer.frame.origin.y;
    CGFloat staticPosition = _fakeTransitionView.frame.origin.y;

    if (fabs(staticPosition - transitioningPosition) > 0.01) {
      [self emitChangePositionDelegateWithPosition:transitioningPosition realtime:YES];
    }
  }
}

#pragma mark - Sheet Configuration

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
    // Initialize with placeholder - will be updated when sheet settles at each detent
    [_resolvedDetentPositions addObject:@(0)];
  }

  sheet.detents = detents;

  // Setup dimmed background
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

  // -1 represents "auto" (fit content height)
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
  return [UISheetPresentationControllerDetent
    customDetentWithIdentifier:identifier
                      resolver:^CGFloat(id<UISheetPresentationControllerDetentResolutionContext> context) {
                        CGFloat maxDetentValue = context.maximumDetentValue;
                        CGFloat maxValue =
                          self.maxHeight ? fmin(maxDetentValue, [self.maxHeight floatValue]) : maxDetentValue;
                        return fmin(height, maxValue);
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

  // Clamp index to valid range
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
  sheet.prefersGrabberVisible = self.grabber && self.draggable;

  if (self.cornerRadius) {
    sheet.preferredCornerRadius = [self.cornerRadius floatValue];
  } else {
    sheet.preferredCornerRadius = UISheetPresentationControllerAutomaticDimension;
  }

  self.view.backgroundColor = self.backgroundColor;

  // Setup or remove blur effect
  if (self.blurTint && self.blurTint.length > 0) {
    // Create blur view if needed
    if (!_blurView) {
      _blurView = [[TrueSheetBlurView alloc] init];
      _blurView.frame = self.view.bounds;
      _blurView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
      [self.view insertSubview:_blurView atIndex:0];
    }

    // Update blur properties and apply effect
    _blurView.blurTint = self.blurTint;
    _blurView.blurIntensity = self.blurIntensity;
    _blurView.blurInteraction = self.blurInteraction;
    [_blurView applyBlurEffect];
  } else {
    // Remove blur effect
    if (_blurView) {
      [_blurView removeBlurEffect];
      [_blurView removeFromSuperview];
      _blurView = nil;
    }
  }
}

#pragma mark - UISheetPresentationControllerDelegate

- (void)sheetPresentationControllerDidChangeSelectedDetentIdentifier:
  (UISheetPresentationController *)sheetPresentationController {
  if ([self.delegate respondsToSelector:@selector(viewControllerDidChangeDetent:position:detent:)]) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSInteger index = [self currentDetentIndex];
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
  // Prevent react-native-screens from dismissing this sheet when presenting a modal
  return NO;
}

- (UIViewController *)newPresentingViewController {
  // Allow react-native-screens to present modals on top of the sheet's content
  return self;
}
#endif

@end
