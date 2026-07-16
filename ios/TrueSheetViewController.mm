//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "TrueSheetViewController.h"
#import "TrueSheetContainerView.h"
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
#import <objc/runtime.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>

using namespace facebook::react;

typedef struct {
  CGFloat position;
  CGFloat detent;
  CGFloat index;
} TrueSheetPositionState;

static BOOL TrueSheetPositionStateEquals(TrueSheetPositionState a, TrueSheetPositionState b) {
  return fabs(a.position - b.position) <= 0.01 && fabs(a.detent - b.detent) <= 0.01 && fabs(a.index - b.index) <= 0.01;
}

static char TrueSheetAccessibilityWindowOwnerKey;
static char TrueSheetAccessibilityWindowPreviousElementsKey;

@interface TrueSheetViewController ()

- (UIViewController *)accessibilityPresentingViewController;
- (void)restoreWindowAccessibilityElements;
- (void)setSheetAccessibilityElementsHidden:(BOOL)hidden;
- (void)setAccessibilityContentElement:(UIView *)contentView;
- (void)endInteractiveDismissState;
- (void)animateInteractiveContainerToTransform:(CGAffineTransform)transform
                                      duration:(NSTimeInterval)duration
                          allowUserInteraction:(BOOL)allowUserInteraction
                                    completion:(void (^)(void))completion;

@end

@implementation TrueSheetViewController {
  TrueSheetPositionState _lastEmittedPositionState;
  CGSize _lastReportedSize;
  CGFloat _autoDetentHeight;
  CGFloat _peekDetentHeight;
  NSInteger _pendingDetentIndex;

  // Single source of truth for position: a display link that samples the
  // presented view's on-screen position and settles (then stops) on its own.
  CADisplayLink *_positionLink;
  CGFloat _lastSampledPosition;
  NSInteger _stableFrameCount;
  BOOL _needsOffsetLearn;
  BOOL _isDragging;
  BOOL _isWillDismissEmitted;

  BOOL _isInteractiveDismiss;
  CGFloat _interactiveStartPosition;
  UIView *_interactiveContainerView;
  NSUInteger _interactiveGeneration;

  __weak TrueSheetViewController *_parentSheetController;

  UIView *_anchorView;

  __weak UIWindow *_accessibilityWindow;

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
    _footerHeight = @(0);
    _peekContentHeight = @(0);
    _grabber = YES;
    _draggable = YES;
    _scrollingExpandsSheet = YES;
    _dismissible = YES;
    _dimmed = YES;
    _dimmedDetentIndex = @(0);
    _presentation = facebook::react::TrueSheetViewPresentation::Page;
    _lastEmittedPositionState = (TrueSheetPositionState){0, 0, 0};
    _isDragging = NO;
    _isPresented = NO;
    _isWillDismissEmitted = NO;
    _activeDetentIndex = -1;
    _pendingDetentIndex = -1;

    _blurInteraction = YES;
    _insetAdjustment = TrueSheetViewInsetAdjustment::Automatic;
    _detentCalculator = [[TrueSheetDetentCalculator alloc] init];
    _detentCalculator.delegate = self;
  }
  return self;
}

- (void)dealloc {
  [self restoreWindowAccessibilityElements];
  [_positionLink invalidate];
  _positionLink = nil;
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

// YES when any layer from the presented view up to the window has in-flight
// animations (detent snap, present/dismiss transition, container settle).
- (BOOL)isPresentedViewAnimating {
  for (CALayer *layer = self.presentedView.layer; layer; layer = layer.superlayer) {
    if (layer.animationKeys.count > 0) {
      return YES;
    }
  }
  return NO;
}

/**
 * The sheet's live on-screen position. At rest and during drags (direct frame
 * sets) this is the model position; during animations it adds the
 * presentation-vs-model delta measured in window space, so ancestor animations
 * compose and persistent transforms (e.g. floating-sheet inset) cancel out.
 */
- (CGFloat)livePosition {
  UIView *presentedView = self.presentedView;
  UIWindow *window = presentedView.window;
  UIView *containerView = self.sheet.containerView;

  // Direct (non-animated) translation applied during an interactive nav dismiss.
  CGFloat containerTy = containerView ? containerView.transform.ty : 0;

  if (!presentedView || !window || !self.isPresentedViewAnimating) {
    return self.currentPosition + containerTy;
  }

  CALayer *modelLayer = presentedView.layer;
  CALayer *presentationLayer = modelLayer.presentationLayer;
  CALayer *rootModel = window.layer;
  CALayer *rootPresentation = rootModel.presentationLayer;
  if (!presentationLayer || !rootPresentation) {
    return self.currentPosition + containerTy;
  }

  CGFloat modelY = [modelLayer convertPoint:CGPointZero toLayer:rootModel].y;
  CGFloat presentationY = [presentationLayer convertPoint:CGPointZero toLayer:rootPresentation].y;
  return self.currentPosition + (presentationY - modelY) + containerTy;
}

- (CGFloat)screenHeight {
  UIWindow *window = self.view.window;
  return window ? window.bounds.size.height : UIScreen.mainScreen.bounds.size.height;
}

- (CGFloat)detentBottomAdjustmentForHeight:(CGFloat)height {
  if (_insetAdjustment == TrueSheetViewInsetAdjustment::Automatic) {
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

  _blurView = [[TrueSheetBlurView alloc] init];
  [_blurView addToView:self.view];

  _grabberView = [[TrueSheetGrabberView alloc] init];
  _grabberView.hidden = YES;
  [_grabberView addToView:self.view];
}

- (void)viewWillAppear:(BOOL)animated {
  [super viewWillAppear:animated];

  _blurView.alpha = 1;

  if (!_isPresented) {
    UIViewController *presenter = self.presentingViewController;
    if ([presenter isKindOfClass:[TrueSheetViewController class]]) {
      _parentSheetController = (TrueSheetViewController *)presenter;
      [_parentSheetController.delegate viewControllerWillBlur];
      [_parentSheetController setAccessibilityContentElement:self.accessibilityContentView ?: self.view];
    }

    dispatch_async(dispatch_get_main_queue(), ^{
      NSInteger index = self.currentDetentIndex;
      CGFloat position = self.currentPosition;
      CGFloat detent = [self detentValueForIndex:index];

      [self.delegate viewControllerWillPresentAtIndex:index position:position detent:detent];
      [self.delegate viewControllerWillFocus];
    });
  }

  // Learn the resolver-vs-actual offset before emitting transition positions so
  // the interpolated index lands exactly on the target detent. The presented
  // frame is already final here (UIKit animates the layer, not the frame).
  [self learnOffsetForDetentIndex:self.currentDetentIndex];
  _needsOffsetLearn = YES;
  [self kickPositionTracking];
}

- (void)viewDidAppear:(BOOL)animated {
  [super viewDidAppear:animated];
  [self setSheetAccessibilityElementsHidden:NO];

  if (!_isPresented) {
    [_parentSheetController.delegate viewControllerDidBlur];

    dispatch_async(dispatch_get_main_queue(), ^{
      NSInteger index = [self currentDetentIndex];
      CGFloat detent = [self detentValueForIndex:index];
      [self.delegate viewControllerDidPresentAtIndex:index position:self.currentPosition detent:detent];
      [self.delegate viewControllerDidFocus];

      [self kickPositionTracking];
    });

    [self setupGestureRecognizer];
    _isPresented = YES;
  }

  [self setupAccessibilityContainer];
}

- (void)setupAccessibilityContainer {
  UIView *contentView = self.accessibilityContentView;
  if (!contentView) {
    return;
  }

  [self setAccessibilityContentElement:contentView];
}

- (UIViewController *)accessibilityPresentingViewController {
  UIViewController *presentingViewController = self.presentingViewController;
  while ([presentingViewController isKindOfClass:[TrueSheetViewController class]] &&
         presentingViewController.presentingViewController) {
    presentingViewController = presentingViewController.presentingViewController;
  }
  return presentingViewController;
}

- (void)restoreWindowAccessibilityElements {
  UIWindow *window = _accessibilityWindow;
  if (window) {
    // The active sheet may temporarily own window accessibility traversal. Only
    // restore the previous value when this controller still owns that override.
    NSValue *ownerValue = objc_getAssociatedObject(window, &TrueSheetAccessibilityWindowOwnerKey);
    if (ownerValue && ownerValue.nonretainedObjectValue == self) {
      id previousElements = objc_getAssociatedObject(window, &TrueSheetAccessibilityWindowPreviousElementsKey);
      window.accessibilityElements = previousElements == [NSNull null] ? nil : previousElements;
      objc_setAssociatedObject(window, &TrueSheetAccessibilityWindowOwnerKey, nil, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
      objc_setAssociatedObject(
        window, &TrueSheetAccessibilityWindowPreviousElementsKey, nil, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    }

    _accessibilityWindow = nil;
  }
}

- (void)setSheetAccessibilityElementsHidden:(BOOL)hidden {
  self.view.accessibilityElementsHidden = hidden;

  UIView *presentedView = self.presentationController.presentedView;
  if (presentedView) {
    presentedView.accessibilityElementsHidden = hidden;
  }
}

- (void)setAccessibilityContentElement:(UIView *)contentView {
  BOOL hasAccessibilityFooterElements = [contentView isKindOfClass:[TrueSheetContainerView class]] &&
                                        [(TrueSheetContainerView *)contentView hasAccessibilityFooterElements];
  // Footer controls exposed as separate accessibility elements can be skipped
  // by XCTest when the presented sheet is a hard modal accessibility boundary.
  BOOL isAccessibilityModal = _dimmed && !hasAccessibilityFooterElements;

  // At a hard modal boundary XCTest skips nested elements, so flatten the
  // container's children into the array. Otherwise expose the container itself:
  // its accessibilityElements getter recomputes live, so a footer/content subtree
  // that remounts (e.g. swapping a footer button on a state change) stays
  // discoverable instead of leaving this snapshot pointing at destroyed views.
  NSArray *accessibilityElements;
  if (isAccessibilityModal) {
    NSArray *contentElements = contentView.accessibilityElements;
    accessibilityElements = contentElements.count > 0 ? contentElements : @[ contentView ];
  } else {
    accessibilityElements = @[ contentView ];
  }

  self.view.isAccessibilityElement = NO;
  self.view.accessibilityViewIsModal = YES;
  self.view.accessibilityElements = accessibilityElements;

  UIView *presentedView = self.presentationController.presentedView;
  if (presentedView) {
    presentedView.isAccessibilityElement = NO;
    presentedView.accessibilityViewIsModal = isAccessibilityModal;
    presentedView.accessibilityElements = accessibilityElements;

    UIWindow *window = self.view.window;
    UIViewController *presentingViewController = [self accessibilityPresentingViewController];
    if (window && presentingViewController.view) {
      if (!_accessibilityWindow) {
        _accessibilityWindow = window;
        id previousElements = objc_getAssociatedObject(window, &TrueSheetAccessibilityWindowPreviousElementsKey);
        if (!previousElements) {
          previousElements = window.accessibilityElements ?: [NSNull null];
          objc_setAssociatedObject(window, &TrueSheetAccessibilityWindowPreviousElementsKey, previousElements,
            OBJC_ASSOCIATION_RETAIN_NONATOMIC);
        }
      }
      objc_setAssociatedObject(window, &TrueSheetAccessibilityWindowOwnerKey, [NSValue valueWithNonretainedObject:self],
        OBJC_ASSOCIATION_RETAIN_NONATOMIC);
      window.accessibilityElements =
        isAccessibilityModal ? @[ presentedView ] : @[ presentingViewController.view, presentedView ];
      return;
    }
  }

  [self restoreWindowAccessibilityElements];
}

#pragma mark - Presentation

- (void)presentViewController:(UIViewController *)viewControllerToPresent
                     animated:(BOOL)flag
                   completion:(void (^)(void))completion {
  // A non-sheet controller (e.g. an action sheet, alert, or image picker) is about
  // to present over us. Clear our window accessibility override so UIKit's default
  // traversal surfaces it for XCTest and assistive technologies; we reclaim the
  // override when it dismisses. Nested sheets claim their own override.
  if (![viewControllerToPresent isKindOfClass:[TrueSheetViewController class]]) {
    self.view.window.accessibilityElements = nil;
  }

  [super presentViewController:viewControllerToPresent animated:flag completion:completion];
}

- (void)dismissViewControllerAnimated:(BOOL)flag completion:(void (^)(void))completion {
  [super dismissViewControllerAnimated:flag
                            completion:^{
                              if (completion) {
                                completion();
                              }

                              // Reclaim the window accessibility override once nothing
                              // else is presented over us.
                              if (self.isPresented && self.presentedViewController == nil) {
                                [self setupAccessibilityContainer];
                              }
                            }];
}

- (void)emitWillDismissEvents {
  if (self.isBeingDismissed && !_isWillDismissEmitted) {
    _isWillDismissEmitted = YES;

    [self.delegate viewControllerWillBlur];
    [self.delegate viewControllerWillDismiss];
    [_parentSheetController.delegate viewControllerWillFocus];
  }
}

- (void)emitDidDismissEvents {
  if (self.isBeingDismissed) {
    [self restoreWindowAccessibilityElements];
    _isPresented = NO;
    _isWillDismissEmitted = NO;

    [_anchorView removeFromSuperview];
    _anchorView = nil;

    [_parentSheetController.delegate viewControllerDidFocus];
    [_parentSheetController setSheetAccessibilityElementsHidden:NO];
    [_parentSheetController setupAccessibilityContainer];
    _parentSheetController = nil;

    [self.delegate viewControllerDidBlur];
    [self.delegate viewControllerDidDismiss];
  }
}

- (void)viewWillDisappear:(BOOL)animated {
  [super viewWillDisappear:animated];
  [self restoreWindowAccessibilityElements];
  [self setSheetAccessibilityElementsHidden:YES];

  // Dispatch to allow pan gesture to set _isDragging before checking;
  // the position tick emits when the sheet is transitioning to dismiss
  dispatch_async(dispatch_get_main_queue(), ^{
    if (!self->_isDragging) {
      [self emitWillDismissEvents];
    }
  });

  [self kickPositionTracking];
}

- (void)viewDidDisappear:(BOOL)animated {
  [super viewDidDisappear:animated];

  // Backstop: if the sheet is torn down mid-gesture (e.g. owning view deallocated),
  // the observer can't reach us through its weak delegate, so end here.
  if (_isInteractiveDismiss) {
    [self endInteractiveDismissState];
  }

  [self emitDidDismissEvents];
  [self stopPositionTracking];
}

- (void)viewWillLayoutSubviews {
  [super viewWillLayoutSubviews];

  // Any layout can move the sheet (drag, keyboard, rotation, detent resize) —
  // wake the position tracker; it emits per-frame and settles on its own.
  [self kickPositionTracking];
}

- (void)viewDidLayoutSubviews {
  [super viewDidLayoutSubviews];

  // Report any size change (detent resize, keyboard, rotation) so Yoga
  // relayouts the container synchronously with the sheet.
  CGSize size = self.view.frame.size;
  if (!CGSizeEqualToSize(_lastReportedSize, size)) {
    _lastReportedSize = size;
    [self.delegate viewControllerDidChangeSize:size];
  }
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
    RCTScrollViewComponentView *scrollViewComponent = [contentView findScrollView];
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

  [self.delegate viewControllerDidDrag:gesture.state index:index position:self.currentPosition detent:detent];

  switch (gesture.state) {
    case UIGestureRecognizerStateBegan:
      _isDragging = YES;
      [self kickPositionTracking];
      break;
    case UIGestureRecognizerStateChanged:
      [self kickPositionTracking];
      break;
    case UIGestureRecognizerStateEnded:
    case UIGestureRecognizerStateCancelled:
      _isDragging = NO;
      _needsOffsetLearn = YES;
      [self kickPositionTracking];
      break;
    default:
      break;
  }
}

#pragma mark - Position Tracking

/**
 * Wakes the position tracker. Called from anything that can move the sheet
 * (layout, drag, transitions, interactive dismiss, detent changes). The tick
 * emits realtime positions while the sheet moves and settles + stops itself
 * once it comes to rest, so kicks are cheap and idempotent.
 */
- (void)kickPositionTracking {
  _stableFrameCount = 0;
  if (!_positionLink) {
    _lastSampledPosition = self.livePosition;
    _positionLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(handlePositionTick)];
    [_positionLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
  }

  // Whatever moves this sheet can also move the sheets behind it (deck effect,
  // detent re-resolution) without their own layout firing — wake the stack.
  [_parentSheetController kickPositionTracking];
}

- (void)stopPositionTracking {
  [_positionLink invalidate];
  _positionLink = nil;
}

- (void)handlePositionTick {
  UIView *presentedView = self.presentedView;
  if (!presentedView) {
    // Nothing to track (e.g. torn down mid-animation) — stop so the link
    // doesn't keep this controller alive.
    if (++_stableFrameCount >= 90) {
      [self stopPositionTracking];
    }
    return;
  }

  CGFloat position = self.livePosition;
  BOOL moved = fabs(position - _lastSampledPosition) > 0.01;
  _lastSampledPosition = position;

  if (self.isBeingDismissed) {
    [self emitWillDismissEvents];

    // Hide blur at the end of dismiss to prevent UIVisualEffectView
    // from causing a flicker/flash at the bottom edge of the sheet.
    if (self.screenHeight - position < 1) {
      _blurView.alpha = 0;
    }
  }

  if (moved) {
    _stableFrameCount = 0;

    // Emit even when a child sheet sits on top — the parent moves behind it
    // (deck effect, detent re-resolution) and consumers track that live.
    [self emitChangePositionDelegateWithPosition:position realtime:YES debug:@"tick"];
    return;
  }

  // Never settle mid-gesture or mid-transition — learning an offset there
  // would store a bogus value.
  if (_isDragging || _isInteractiveDismiss || self.isBeingPresented || self.isBeingDismissed ||
      self.transitionCoordinator != nil) {
    _stableFrameCount = 0;
    return;
  }

  // Settle once the sheet has been still with no in-flight animations; the
  // frame cap guards against leftover animations pinning the link forever.
  _stableFrameCount++;
  if (_stableFrameCount >= (self.isPresentedViewAnimating ? 90 : 3)) {
    [self settlePosition];
  }
}

/**
 * The sheet came to rest: learn the resolver-vs-actual offset when a detent
 * change requested it, flush any pending detent-change event, emit the final
 * position, and stop the tracker.
 */
- (void)settlePosition {
  NSInteger index = self.currentDetentIndex;

  // Don't learn while a child sits on top — the deck transform skews the
  // measured frame. Keep the flag so the next unobstructed settle learns.
  if (_needsOffsetLearn && self.presentedViewController == nil) {
    _needsOffsetLearn = NO;
    [self learnOffsetForDetentIndex:index];
  }

  if (_pendingDetentIndex >= 0) {
    NSInteger pendingIndex = _pendingDetentIndex;
    _pendingDetentIndex = -1;

    CGFloat detent = [self detentValueForIndex:pendingIndex];
    [self.delegate viewControllerDidChangeDetent:pendingIndex position:self.currentPosition detent:detent];
  }

  [_grabberView updateAccessibilityValueWithIndex:index detentCount:_detents.count];
  [self emitChangePositionDelegateWithPosition:self.currentPosition realtime:NO debug:@"settle"];
  [self stopPositionTracking];
}

#pragma mark - Interactive Navigation Dismiss

- (void)beginInteractiveDismiss {
  if (_isInteractiveDismiss) {
    // A settle animation from a prior gesture is still running. Stop it and reset so
    // this gesture tracks from a clean state; its stale completion is ignored via the
    // generation check in animateInteractiveContainerToTransform.
    [_interactiveContainerView.layer removeAllAnimations];
    [self endInteractiveDismissState];
  }

  _interactiveGeneration += 1;
  _isInteractiveDismiss = YES;
  _interactiveStartPosition = self.currentPosition;
  _interactiveContainerView = self.sheet.containerView;

  // The container translation doesn't trigger our layout, so wake the tracker
  // explicitly; livePosition picks up the container transform.
  [self kickPositionTracking];
}

// Translate the presentation container, not the sheet's presentedView (whose transform
// UISheetPresentationController owns for the floating-sheet inset). Only runs for undimmed
// sheets — a dimmed sheet's dimming view intercepts the edge-swipe so the pop never starts.
- (void)updateInteractiveDismiss:(CGFloat)progress {
  if (!_isInteractiveDismiss) {
    return;
  }
  CGFloat clamped = fmin(1, fmax(0, progress));
  CGFloat dy = clamped * (self.screenHeight - _interactiveStartPosition);
  _interactiveContainerView.transform = CGAffineTransformMakeTranslation(0, dy);
}

- (void)cancelInteractiveDismissWithDuration:(NSTimeInterval)duration {
  if (!_isInteractiveDismiss) {
    return;
  }
  [self animateInteractiveContainerToTransform:CGAffineTransformIdentity
                                      duration:duration
                          allowUserInteraction:YES
                                    completion:nil];
}

- (void)finishInteractiveDismissWithDuration:(NSTimeInterval)duration completion:(void (^)(void))completion {
  if (!_isInteractiveDismiss) {
    if (completion) {
      completion();
    }
    return;
  }
  // Leave the sheet translated off-screen; the caller tears it down non-animated
  // from here so there is no second slide.
  CGFloat dy = self.screenHeight - _interactiveStartPosition;
  [self animateInteractiveContainerToTransform:CGAffineTransformMakeTranslation(0, dy)
                                      duration:duration
                          allowUserInteraction:NO
                                    completion:completion];
}

- (void)animateInteractiveContainerToTransform:(CGAffineTransform)transform
                                      duration:(NSTimeInterval)duration
                          allowUserInteraction:(BOOL)allowUserInteraction
                                    completion:(void (^)(void))completion {
  UIView *container = _interactiveContainerView;
  NSUInteger generation = _interactiveGeneration;

  UIViewAnimationOptions options = UIViewAnimationOptionCurveEaseOut | UIViewAnimationOptionBeginFromCurrentState;
  if (allowUserInteraction) {
    options |= UIViewAnimationOptionAllowUserInteraction;
  }

  [UIView animateWithDuration:fmax(duration, 0.2)
    delay:0
    options:options
    animations:^{
      container.transform = transform;
    }
    completion:^(BOOL finished) {
      // A newer gesture superseded this settle and owns teardown now.
      if (generation != self->_interactiveGeneration) {
        return;
      }
      [self endInteractiveDismissState];
      if (completion) {
        completion();
      }
    }];
}

- (void)endInteractiveDismissState {
  _isInteractiveDismiss = NO;
  _interactiveContainerView = nil;
  _interactiveStartPosition = 0;
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

  TrueSheetPositionState state = {
    .position = position,
    .detent = [self interpolatedDetentForPosition:position],
    .index = [self interpolatedIndexForPosition:position],
  };

  if (!TrueSheetPositionStateEquals(_lastEmittedPositionState, state)) {
    _lastEmittedPositionState = state;

    [self.delegate viewControllerDidChangePosition:state.index
                                          position:state.position
                                            detent:state.detent
                                          realtime:realtime];
  }
}

- (void)learnOffsetForDetentIndex:(NSInteger)index {
  [_detentCalculator learnOffsetForDetentIndex:index];
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

/**
 * Applies a content/header/footer/peek size change to the already-built
 * detents. Auto and peek detents resolve lazily from snapshots, so this only
 * refreshes the snapshots and invalidates — never reassigns `sheet.detents`,
 * which would force UIKit to re-layout the whole presentation stack (visibly
 * perturbing a sheet behind this one).
 */
- (void)setupSheetDetentsForSizeChange {
  if (@available(iOS 16.0, *)) {
    CGFloat autoHeight = [self.contentHeight floatValue] + [self.headerHeight floatValue];
    CGFloat peekHeight = [_detentCalculator peekHeight];

    if (fabs(autoHeight - _autoDetentHeight) < 0.5 && fabs(peekHeight - _peekDetentHeight) < 0.5) {
      return;
    }

    _autoDetentHeight = autoHeight;
    _peekDetentHeight = peekHeight;

    _needsOffsetLearn = YES;
    [self.sheet animateChanges:^{
      [self.sheet invalidateDetents];
    }];
    [self kickPositionTracking];
  }
  // iOS 15: detents are fixed medium/large — size changes can't affect them.
}

- (void)setupSheetDetentsForDetentsChange {
  _needsOffsetLearn = YES;
  [self setupSheetDetents];
  [self kickPositionTracking];
}

- (void)setupSheetDetents {
  UISheetPresentationController *sheet = self.sheet;
  if (!sheet) {
    RCTLogError(@"TrueSheet: sheetPresentationController is nil in setupSheetDetents");
    return;
  }

  NSMutableArray<UISheetPresentationControllerDetent *> *detents = [NSMutableArray array];
  [_detentCalculator clearResolvedHeights];

  _autoDetentHeight = [self.contentHeight floatValue] + [self.headerHeight floatValue];
  _peekDetentHeight = [_detentCalculator peekHeight];

  for (NSInteger index = 0; index < self.detents.count; index++) {
    id detent = self.detents[index];
    UISheetPresentationControllerDetent *sheetDetent = [self detentForValue:detent atIndex:index];
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

- (UISheetPresentationControllerDetent *)detentForValue:(id)detent atIndex:(NSInteger)index {
  if (![detent isKindOfClass:[NSNumber class]]) {
    return [UISheetPresentationControllerDetent mediumDetent];
  }

  CGFloat value = [detent doubleValue];

  // Auto/peek resolve from height snapshots — refreshed only in
  // setupSheetDetents and setupSheetDetentsForSizeChange — so size changes are
  // picked up on invalidation, while UIKit's spontaneous re-resolutions (e.g.
  // while a child sheet dismisses) read a stable value.
  if (value == -1) {
    if (@available(iOS 16.0, *)) {
      return [self customDetentWithIdentifier:@"custom-auto"
                                      atIndex:index
                                  heightBlock:^CGFloat {
                                    return self->_autoDetentHeight;
                                  }];
    } else {
      return [UISheetPresentationControllerDetent mediumDetent];
    }
  }

  if (value == -2) {
    if (@available(iOS 16.0, *)) {
      return [self customDetentWithIdentifier:@"custom-peek"
                                      atIndex:index
                                  heightBlock:^CGFloat {
                                    return self->_peekDetentHeight;
                                  }];
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
    return [self customDetentWithIdentifier:detentId height:sheetHeight atIndex:index];
  } else if (value >= 0.5) {
    return [UISheetPresentationControllerDetent largeDetent];
  } else {
    return [UISheetPresentationControllerDetent mediumDetent];
  }
}

- (UISheetPresentationControllerDetent *)customDetentWithIdentifier:(NSString *)identifier
                                                             height:(CGFloat)height
                                                            atIndex:(NSInteger)index API_AVAILABLE(ios(16.0)) {
  return [self customDetentWithIdentifier:identifier
                                  atIndex:index
                              heightBlock:^CGFloat {
                                return height;
                              }];
}

- (UISheetPresentationControllerDetent *)customDetentWithIdentifier:(NSString *)identifier
                                                            atIndex:(NSInteger)index
                                                        heightBlock:(CGFloat (^)(void))heightBlock
  API_AVAILABLE(ios(16.0)) {
  return [UISheetPresentationControllerDetent
    customDetentWithIdentifier:identifier
                      resolver:^CGFloat(id<UISheetPresentationControllerDetentResolutionContext> context) {
                        CGFloat maxDetentValue = context.maximumDetentValue;
                        self->_detentCalculator.maxDetentHeight = maxDetentValue;

                        CGFloat height = heightBlock();
                        CGFloat bottomAdjustment = [self detentBottomAdjustmentForHeight:height];
                        CGFloat maxValue = self.maxContentHeight
                                             ? fmin(maxDetentValue, [self.maxContentHeight floatValue])
                                             : maxDetentValue;
                        CGFloat adjustedHeight = height - bottomAdjustment;
                        CGFloat resolved = fmin(adjustedHeight, maxValue);

                        NSMutableArray *heights = self->_detentCalculator.resolvedDetentHeights;
                        if (heights && index >= 0 && index < (NSInteger)heights.count) {
                          heights[index] = @(resolved);
                        }

                        return resolved;
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
  _needsOffsetLearn = YES;
  [self applyActiveDetent];
  [self kickPositionTracking];
}

- (void)setupBackground {
  auto effectiveBackgroundBlur = self.backgroundBlur;
  if (@available(iOS 26.0, *)) {
    // iOS 26+ has default liquid glass effect
  } else if (effectiveBackgroundBlur == TrueSheetViewBackgroundBlur::None && !self.backgroundColor) {
    effectiveBackgroundBlur = TrueSheetViewBackgroundBlur::SystemMaterial;
  }

  BOOL hasBlur = effectiveBackgroundBlur != TrueSheetViewBackgroundBlur::None;

  _blurView.backgroundBlur = hasBlur ? effectiveBackgroundBlur : TrueSheetViewBackgroundBlur::None;
  _blurView.blurIntensity = self.blurIntensity;
  _blurView.blurInteraction = self.blurInteraction;
  [_blurView applyBlurEffect];

#if RNTS_IPHONE_OS_VERSION_AVAILABLE(26_1) && !TARGET_OS_MACCATALYST
  if (@available(iOS 26.1, *)) {
    if (!self.isDesignCompatibilityMode) {
      if (self.backgroundColor) {
        self.sheet.backgroundEffect = [UIColorEffect effectWithColor:self.backgroundColor];
      } else if (hasBlur) {
        self.sheet.backgroundEffect = [UIColorEffect effectWithColor:[UIColor clearColor]];
      } else {
        self.sheet.backgroundEffect = nil;
      }
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

    GrabberOptions *options = self.grabberOptions;
    _grabberView.grabberWidth = options.width;
    _grabberView.grabberHeight = options.height;
    _grabberView.topMargin = options.topMargin;
    _grabberView.cornerRadius = options.cornerRadius;
    _grabberView.color = options.color;
    _grabberView.adaptive = @(options.adaptive);
    [_grabberView applyConfiguration];
    _grabberView.hidden = !showGrabber;

    __weak __typeof(self) weakSelf = self;
    _grabberView.onTap = ^{
      [weakSelf handleGrabberTap];
    };
    _grabberView.onIncrement = ^{
      __strong __typeof(weakSelf) strongSelf = weakSelf;
      if (!strongSelf)
        return;
      NSInteger current = strongSelf.currentDetentIndex;
      NSInteger count = strongSelf->_detents.count;
      if (current >= 0 && current < count - 1) {
        [strongSelf.sheet animateChanges:^{
          [strongSelf resizeToDetentIndex:current + 1];
        }];
      }
    };
    _grabberView.onDecrement = ^{
      __strong __typeof(weakSelf) strongSelf = weakSelf;
      if (!strongSelf)
        return;
      NSInteger current = strongSelf.currentDetentIndex;
      if (current > 0) {
        [strongSelf.sheet animateChanges:^{
          [strongSelf resizeToDetentIndex:current - 1];
        }];
      } else if (strongSelf.dismissible) {
        [strongSelf.presentingViewController dismissViewControllerAnimated:YES completion:nil];
      }
    };

    [self.view bringSubviewToFront:_grabberView];
  } else {
    self.sheet.prefersGrabberVisible = showGrabber;
    _grabberView.hidden = YES;
    _grabberView.onTap = nil;
    _grabberView.onIncrement = nil;
    _grabberView.onDecrement = nil;
  }
}

- (void)handleGrabberTap {
  NSInteger detentCount = _detents.count;
  if (detentCount == 0)
    return;

  NSInteger currentIndex = self.currentDetentIndex;
  if (currentIndex < 0)
    return;

  NSInteger nextIndex = (currentIndex + 1) % detentCount;
  if (nextIndex == 0 && detentCount == 1 && self.dismissible) {
    [self.presentingViewController dismissViewControllerAnimated:YES completion:nil];
  } else {
    [self.sheet animateChanges:^{
      [self resizeToDetentIndex:nextIndex];
    }];
  }
}

- (BOOL)isAnchored {
  return self.anchor == TrueSheetViewAnchor::Left || self.anchor == TrueSheetViewAnchor::Right;
}

- (void)setupAnchorViewInView:(UIView *)parentView {
  if (!parentView)
    return;

  [_anchorView removeFromSuperview];
  _anchorView = nil;

  if (!self.isAnchored) {
    self.sheetPresentationController.sourceView = nil;
    return;
  }

  _anchorView = [[UIView alloc] init];
  _anchorView.userInteractionEnabled = NO;
  _anchorView.translatesAutoresizingMaskIntoConstraints = NO;
  [parentView addSubview:_anchorView];

  NSLayoutAnchor *horizontalAnchor =
    self.anchor == TrueSheetViewAnchor::Right ? parentView.trailingAnchor : parentView.leadingAnchor;

  [NSLayoutConstraint activateConstraints:@[
    [_anchorView.bottomAnchor constraintEqualToAnchor:parentView.bottomAnchor],
    [horizontalAnchor constraintEqualToAnchor:_anchorView.leadingAnchor],
  ]];

  self.sheetPresentationController.sourceView = _anchorView;
}

- (void)setupSheetSizing {
  UISheetPresentationController *sheet = self.sheet;
  if (!sheet)
    return;

  // `presentation` is absolute on the form side: 'form' always renders a
  // centered form sheet and ignores `maxContentWidth`. For 'page' with a
  // custom `maxContentWidth`, prefersPageSizing has to flip to NO since
  // `widthFollowsPreferredContentSizeWhenEdgeAttached` only takes effect
  // when the sheet is edge-attached (Apple API constraint).
  BOOL formSheet = self.presentation == facebook::react::TrueSheetViewPresentation::Form;
  BOOL hasMaxWidth = self.maxContentWidth != nil && !formSheet;

  if (@available(iOS 17.0, *)) {
    sheet.prefersPageSizing = !formSheet && !hasMaxWidth;
  }

  sheet.widthFollowsPreferredContentSizeWhenEdgeAttached = hasMaxWidth;

  if (hasMaxWidth) {
    CGFloat height = self.maxContentHeight ? [self.maxContentHeight floatValue] : self.screenHeight;
    self.preferredContentSize = CGSizeMake([self.maxContentWidth floatValue], height);
  } else {
    self.preferredContentSize = CGSizeZero;
  }
}

- (void)setupSheetProps {
  UISheetPresentationController *sheet = self.sheet;
  if (!sheet)
    return;

  sheet.delegate = self;
  sheet.prefersEdgeAttachedInCompactHeight = YES;
  sheet.prefersScrollingExpandsWhenScrolledToEdge = self.draggable && self.scrollingExpandsSheet;

  if (self.cornerRadius) {
    sheet.preferredCornerRadius = [self.cornerRadius floatValue];
  } else {
    sheet.preferredCornerRadius = UISheetPresentationControllerAutomaticDimension;
  }

  [self setupBackground];
  [self setupGrabber];
}

#pragma mark - UISheetPresentationControllerDelegate

- (BOOL)presentationControllerShouldDismiss:(UIPresentationController *)presentationController {
  return self.dismissible;
}

- (void)sheetPresentationControllerDidChangeSelectedDetentIdentifier:
  (UISheetPresentationController *)sheetPresentationController {
  _needsOffsetLearn = YES;
  [self kickPositionTracking];

  dispatch_async(dispatch_get_main_queue(), ^{
    NSInteger index = self.currentDetentIndex;
    if (index >= 0) {
      CGFloat detent = [self detentValueForIndex:index];
      [self.delegate viewControllerDidChangeDetent:index position:self.currentPosition detent:detent];
    }
  });
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
