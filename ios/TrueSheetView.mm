//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "TrueSheetView.h"
#import "TrueSheetContainerView.h"
#import "TrueSheetContentView.h"
#import "TrueSheetFooterView.h"
#import "TrueSheetModule.h"
#import "TrueSheetViewController.h"
#import "core/RNScreensEventObserver.h"
#import "events/TrueSheetDragEvents.h"
#import "events/TrueSheetFocusEvents.h"
#import "events/TrueSheetLifecycleEvents.h"
#import "events/TrueSheetStateEvents.h"
#import "utils/WindowUtil.h"

#import <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>
#import <react/renderer/components/TrueSheetSpec/RCTComponentViewHelpers.h>
#import <react/renderer/components/TrueSheetSpec/TrueSheetInsets.h>
#import <react/renderer/components/TrueSheetSpec/TrueSheetViewComponentDescriptor.h>
#import <react/renderer/components/TrueSheetSpec/TrueSheetViewShadowNode.h>
#import <react/renderer/components/TrueSheetSpec/TrueSheetViewState.h>

#import <QuartzCore/QuartzCore.h>
#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>
#import <React/RCTLog.h>
#import <React/RCTSurfaceTouchHandler.h>
#import <React/RCTUtils.h>
#import <react/renderer/core/State.h>

using namespace facebook::react;

// Native-backed children such as SwiftUI views can publish their intrinsic size
// several display frames after entering a window. Wait for a short quiet period,
// but cap the total delay so a broken child cannot block presentation forever.
static const NSTimeInterval InitialMeasurementSettleInterval = 0.08;
static const NSTimeInterval InitialMeasurementTimeout = 0.5;

@interface TrueSheetView () <TrueSheetViewControllerDelegate,
  TrueSheetContainerViewDelegate,
  RNScreensEventObserverDelegate>

- (void)stageContainerViewForMeasurement;
- (BOOL)stageContainerViewInMeasurementController;
- (void)attachContainerViewToController;
- (void)removeMeasurementHostView;
- (void)scheduleInitialPresentationAfterMeasurement;
- (void)cancelPendingInitialPresentation;
@end

@implementation TrueSheetView {
  TrueSheetContainerView *_containerView;
  TrueSheetViewController *_controller;
  RCTSurfaceTouchHandler *_touchHandler;
  TrueSheetViewShadowNode::ConcreteState::Shared _state;
  UIView *_snapshotView;
  CGSize _lastStateSize;
  NSInteger _initialDetentIndex;
  TrueSheetViewInsetAdjustment _insetAdjustment;
  ScrollableOptions *_scrollableOptions;
  NSInteger _scrollableHandle;
  BOOL _initialDetentAnimated;
  BOOL _isSheetUpdatePending;
  BOOL _pendingLayoutUpdate;
  BOOL _didInitiallyPresent;
  BOOL _dismissedByNavigation;
  BOOL _pendingNavigationRepresent;
  BOOL _pendingMountEvent;
  BOOL _pendingSizeChange;
  BOOL _pendingPropsUpdate;
  BOOL _isInitialMeasurementPending;
  NSUInteger _initialMeasurementGeneration;
  CFTimeInterval _initialMeasurementDeadline;
  UIView *_measurementHostView;
  UIViewController *_measurementViewController;
  NSArray *_pendingDetents;
  RNScreensEventObserver *_screensEventObserver;
}

#pragma mark - Initialization

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const TrueSheetViewProps>();
    _props = defaultProps;

    self.hidden = YES;
    self.userInteractionEnabled = NO;

    _controller = [[TrueSheetViewController alloc] init];
    _controller.delegate = self;

    _touchHandler = [[RCTSurfaceTouchHandler alloc] init];
    _containerView = nil;
    _snapshotView = nil;
    _lastStateSize = CGSizeZero;
    _initialDetentIndex = -1;
    _initialDetentAnimated = YES;
    _isSheetUpdatePending = NO;
    _isInitialMeasurementPending = NO;
    _initialMeasurementGeneration = 0;
    _initialMeasurementDeadline = 0;

    _screensEventObserver = [[RNScreensEventObserver alloc] init];
    _screensEventObserver.delegate = self;
  }
  return self;
}

- (void)didMoveToWindow {
  [super didMoveToWindow];

  if (!self.window) {
    [self attachContainerViewToController];
    [self removeMeasurementHostView];
    return;
  }

  if (self.tag > 0) {
    [TrueSheetModule registerView:self withTag:@(self.tag)];
  }

  [self stageContainerViewForMeasurement];

  if (_pendingNavigationRepresent && !_controller.isPresented) {
    _pendingNavigationRepresent = NO;
    [self presentAtIndex:_controller.activeDetentIndex animated:YES completion:nil];
    return;
  }

  [self presentInitialIfNeeded];
}

// JS holds initialDetentIndex back one commit so effect-driven content (e.g. a
// navigation footer set via setOptions) commits together with it — by the time
// the prop lands the tree is final and the sheet presents at its final height.
// Called from didMoveToWindow (re-attach) and finalizeUpdates (the prop
// arriving after attach, which didMoveToWindow won't re-fire for).
- (void)presentInitialIfNeeded {
  if (_initialDetentIndex < 0 || _didInitiallyPresent)
    return;

  UIViewController *vc = [self findPresentingViewController];

  // Only present if the view controller is in the same window and not being dismissed
  if (!vc || vc.view.window != self.window || _controller.isBeingDismissed) {
    // Animate next time when sheet finally moves to the correct window
    _initialDetentAnimated = YES;
    return;
  }

  _didInitiallyPresent = YES;
  _isInitialMeasurementPending = YES;

  BOOL usesMeasuredDetent = NO;
  if (_initialDetentIndex < (NSInteger)_controller.detents.count) {
    double detent = [_controller.detents[_initialDetentIndex] doubleValue];
    usesMeasuredDetent = detent == -1 || detent == -2;
  }
  _initialMeasurementDeadline = CACurrentMediaTime() + (usesMeasuredDetent ? InitialMeasurementTimeout : 0);

  [self stageContainerViewForMeasurement];
  [self scheduleInitialPresentationAfterMeasurement];
}

- (void)dealloc {
  [self cancelPendingInitialPresentation];
  [self removeMeasurementHostView];
  [_screensEventObserver stopObserving];
  _screensEventObserver = nil;

  if (_controller && _controller.presentingViewController) {
    // Find the root presenting controller to dismiss the entire stack
    UIViewController *root = _controller.presentingViewController;
    while (root.presentingViewController != nil) {
      root = root.presentingViewController;
    }
    [root dismissViewControllerAnimated:YES completion:nil];
  }

  _didInitiallyPresent = NO;
  _dismissedByNavigation = NO;
  _pendingNavigationRepresent = NO;

  _controller.delegate = nil;
  _controller = nil;

  [_snapshotView removeFromSuperview];
  _snapshotView = nil;

  [TrueSheetModule unregisterViewWithTag:@(self.tag)];
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<TrueSheetViewComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps {
  [super updateProps:props oldProps:oldProps];

  const auto &newProps = *std::static_pointer_cast<TrueSheetViewProps const>(props);

  // Detents (-1 represents "auto")
  NSMutableArray *detents = [NSMutableArray new];
  for (const auto &detent : newProps.detents) {
    [detents addObject:@(detent)];
  }

  if (oldProps) {
    const auto &prevProps = *std::static_pointer_cast<TrueSheetViewProps const>(oldProps);
    if (newProps.detents != prevProps.detents || newProps.insetAdjustment != prevProps.insetAdjustment) {
      _pendingLayoutUpdate = YES;
    }
  }

  if (_controller.isBeingPresented) {
    _pendingDetents = detents;
  } else {
    _controller.detents = detents;
  }

  // Background color
  _controller.backgroundColor = RCTUIColorFromSharedColor(newProps.backgroundColor);

  // Blur tint
  _controller.backgroundBlur = newProps.backgroundBlur;

  // Blur options
  const auto &blurOpts = newProps.blurOptions;
  _controller.blurIntensity = blurOpts.intensity >= 0 ? @(blurOpts.intensity) : nil;
  _controller.blurInteraction = blurOpts.interaction;

  // Corner radius
  _controller.cornerRadius = newProps.cornerRadius < 0 ? nil : @(newProps.cornerRadius);

  // Content height
  _controller.maxContentHeight = newProps.maxContentHeight != 0.0 ? @(newProps.maxContentHeight) : nil;

  // Content width
  _controller.maxContentWidth = newProps.maxContentWidth != 0.0 ? @(newProps.maxContentWidth) : nil;

  // Anchor
  _controller.anchor = newProps.anchor;

  _controller.grabber = newProps.grabber;

  // Grabber options - check if any non-default values are set
  const auto &grabberOpts = newProps.grabberOptions;
  UIColor *grabberColor = RCTUIColorFromSharedColor(grabberOpts.color);
  BOOL hasGrabberOptions = grabberOpts.width > 0 || grabberOpts.height > 0 || grabberOpts.topMargin > 0 ||
                           grabberOpts.cornerRadius >= 0 || grabberColor != nil || !grabberOpts.adaptive;

  if (hasGrabberOptions) {
    GrabberOptions *options = [[GrabberOptions alloc] init];
    if (grabberOpts.width > 0)
      options.width = @(grabberOpts.width);
    if (grabberOpts.height > 0)
      options.height = @(grabberOpts.height);
    if (grabberOpts.topMargin > 0)
      options.topMargin = @(grabberOpts.topMargin);
    if (grabberOpts.cornerRadius >= 0)
      options.cornerRadius = @(grabberOpts.cornerRadius);
    if (grabberColor)
      options.color = grabberColor;
    options.adaptive = grabberOpts.adaptive;
    _controller.grabberOptions = options;
  } else {
    _controller.grabberOptions = nil;
  }

  // Accessibility options - applied to the custom grabber
  _controller.accessibilityOptions = newProps.accessibilityOptions;

  _controller.presentation = newProps.presentation;
  _controller.dismissible = newProps.dismissible;
  _controller.draggable = newProps.draggable;
  _controller.dimmed = newProps.dimmed;

  if (newProps.dimmedDetentIndex >= 0) {
    _controller.dimmedDetentIndex = @(newProps.dimmedDetentIndex);
  }

  _initialDetentIndex = newProps.initialDetentIndex;
  _initialDetentAnimated = newProps.initialDetentAnimated;

  _scrollableHandle = newProps.scrollableHandle;

  const auto &scrollableOpts = newProps.scrollableOptions;
  BOOL scrollingExpandsSheet = scrollableOpts.scrollingExpandsSheet;
  BOOL contentInsetAdjustment = scrollableOpts.contentInsetAdjustmentBehavior;
  auto topEdgeEffect = scrollableOpts.topScrollEdgeEffect;
  auto bottomEdgeEffect = scrollableOpts.bottomScrollEdgeEffect;
  BOOL hasScrollableOptions = scrollableOpts.keyboardScrollOffset > 0 || scrollableOpts.keyboardOffset != 0 ||
                              !scrollingExpandsSheet || !contentInsetAdjustment ||
                              topEdgeEffect != TrueSheetViewTopScrollEdgeEffect::Hidden ||
                              bottomEdgeEffect != TrueSheetViewBottomScrollEdgeEffect::Hidden;

  if (hasScrollableOptions) {
    ScrollableOptions *options = [[ScrollableOptions alloc] init];
    options.contentInsetAdjustment = contentInsetAdjustment;
    options.keyboardScrollOffset = scrollableOpts.keyboardScrollOffset;
    options.keyboardOffset = scrollableOpts.keyboardOffset;
    options.scrollingExpandsSheet = scrollingExpandsSheet;
    options.topScrollEdgeEffect = topEdgeEffect;
    options.bottomScrollEdgeEffect = bottomEdgeEffect;
    _scrollableOptions = options;
  } else {
    _scrollableOptions = nil;
  }

  _controller.scrollingExpandsSheet = scrollingExpandsSheet;

  _controller.absoluteHeader = newProps.headerOptions.position == TrueSheetViewPosition::Absolute;
  _controller.absoluteFooter = newProps.footerOptions.footerPosition == TrueSheetViewFooterPosition::Absolute;

  CGFloat footerKeyboardOffset = newProps.footerOptions.keyboardOffset;
  if (_controller.footerKeyboardOffset != footerKeyboardOffset) {
    _controller.footerKeyboardOffset = footerKeyboardOffset;
    [_containerView updateFooterKeyboardOffset];
  }

  _insetAdjustment = newProps.insetAdjustment;
  _controller.insetAdjustment = _insetAdjustment;

  [self setupScrollable];
}

- (void)updateState:(const State::Shared &)state oldState:(const State::Shared &)oldState {
  _state = std::static_pointer_cast<TrueSheetViewShadowNode::ConcreteState const>(state);

  if (_controller && !_controller.isStackedBehindChild) {
    CGSize size = _controller.view.frame.size;
    if (size.width < 1 || size.height < 1) {
      // Pre-present the controller has no layout yet. Seed with screen
      // dimensions so content (e.g. a FlatList viewport) can lay out and
      // measure before the sheet presents (parity with Android).
      UIWindow *window = [WindowUtil keyWindow];
      size = window ? window.bounds.size : UIScreen.mainScreen.bounds.size;
    }
    [self viewControllerDidChangeSize:size];
  }
}

/**
 * Updates Fabric state with container dimensions for Yoga layout.
 */
- (void)updateStateWithSize:(CGSize)size {
  if (!_state)
    return;

  if (fabs(size.width - _lastStateSize.width) < 0.5 && fabs(size.height - _lastStateSize.height) < 0.5)
    return;

  _lastStateSize = size;

  auto stateData = _state->getData();
  stateData.containerWidth = static_cast<float>(size.width);
  stateData.containerHeight = static_cast<float>(size.height);

  // RN 0.82+ processes immediate state updates in the same layout pass, so Yoga
  // resizes the container synchronously with the sheet (e.g. inside UIKit's
  // animation block during detent transitions).
  _state->updateState(std::move(stateData), facebook::react::EventQueue::UpdateMode::unstable_Immediate);
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask {
  [super finalizeUpdates:updateMask];

  // Emit pending mount event now that eventEmitter is available
  if (_pendingMountEvent && (updateMask & RNComponentViewUpdateMaskEventEmitter)) {
    _pendingMountEvent = NO;
    [TrueSheetLifecycleEvents emitMount:_eventEmitter];
  }

  [self stageContainerViewForMeasurement];

  if (!(updateMask & RNComponentViewUpdateMaskProps) || !_controller)
    return;

  [self setupScrollable];

  if (_controller.isPresented) {
    [self applySheetPropsUpdate];
  } else if (_controller.isBeingPresented) {
    _pendingPropsUpdate = YES;
  } else if (_initialDetentIndex >= 0) {
    _pendingLayoutUpdate = NO;
    if (self.window) {
      [self presentInitialIfNeeded];
    }
  }
}

- (void)prepareForRecycle {
  [super prepareForRecycle];

  [self cancelPendingInitialPresentation];
  [self attachContainerViewToController];
  [self removeMeasurementHostView];

  [TrueSheetModule unregisterViewWithTag:@(self.tag)];

  _lastStateSize = CGSizeZero;
  _didInitiallyPresent = NO;
  _dismissedByNavigation = NO;
  _pendingNavigationRepresent = NO;
}

#pragma mark - Child Component Mounting

- (void)cleanupContainerView {
  if (_containerView == nil)
    return;

  BOOL wasInitialMeasurementPending = _isInitialMeasurementPending;
  [self cancelPendingInitialPresentation];
  if (wasInitialMeasurementPending) {
    _didInitiallyPresent = NO;
  }

  _containerView.delegate = nil;
  [_touchHandler detachFromView:_containerView];
  [_containerView removeFromSuperview];

  _containerView = nil;
  [self removeMeasurementHostView];
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  if (![childComponentView isKindOfClass:[TrueSheetContainerView class]])
    return;

  if (_containerView != nil && _containerView != childComponentView) {
    RCTLogWarn(@"TrueSheet: Sheet can only have one container component.");
    [self cleanupContainerView];
  }

  if (_snapshotView) {
    [_snapshotView removeFromSuperview];
    _snapshotView = nil;
  }

  _containerView = (TrueSheetContainerView *)childComponentView;
  _containerView.delegate = self;

  [_touchHandler attachToView:_containerView];
  [_controller.view addSubview:_containerView];
  [_controller.view bringSubviewToFront:_containerView];
  _containerView.accessibilityViewIsModal = YES;
  _controller.accessibilityContentView = _containerView;
  [_controller setupAccessibilityContainer];

  CGFloat contentHeight = [_containerView contentHeight];
  if (contentHeight > 0) {
    _controller.contentHeight = @(contentHeight);
  }

  CGFloat headerHeight = [_containerView headerHeight];
  if (headerHeight > 0) {
    _controller.headerHeight = @(headerHeight);
  }

  if ([_containerView footerHeight] > 0) {
    [self syncFooterMetrics];
  }

  CGFloat peekContentHeight = [_containerView peekContentHeight];
  if (peekContentHeight > 0) {
    _controller.peekContentHeight = @(peekContentHeight);
  }

  if (_eventEmitter) {
    [TrueSheetLifecycleEvents emitMount:_eventEmitter];
  } else {
    _pendingMountEvent = YES;
  }

  [self stageContainerViewForMeasurement];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  if (![childComponentView isKindOfClass:[TrueSheetContainerView class]])
    return;

  if (_containerView == nil || _containerView != childComponentView)
    return;

  if (_controller.isPresented) {
    UIView *superView = _containerView.superview;
    UIView *snapshot = [_containerView snapshotViewAfterScreenUpdates:NO];
    if (snapshot) {
      snapshot.frame = _containerView.frame;
      [superView insertSubview:snapshot belowSubview:_containerView];
      _snapshotView = snapshot;
    }
  }

  [self cleanupContainerView];
}

#pragma mark - TurboModule Methods

- (void)presentAtIndex:(NSInteger)index
              animated:(BOOL)animated
            completion:(nullable TrueSheetCompletionBlock)completion {
  [self cancelPendingInitialPresentation];

  if (_controller.isBeingPresented || _controller.isPresented) {
    RCTLogWarn(@"TrueSheet: sheet is already presented. Use resize() to change detent.");
    if (completion) {
      completion(YES, nil);
    }
    return;
  }

  // Reset navigation dismiss flag when presenting (handles view recycling edge cases)
  _dismissedByNavigation = NO;

  UIViewController *presentingViewController = [self findPresentingViewController];
  if (!presentingViewController) {
    NSError *error = [NSError errorWithDomain:@"com.lodev09.TrueSheet"
                                         code:1001
                                     userInfo:@{NSLocalizedDescriptionKey : @"No presenting view controller found"}];
    if (completion) {
      completion(NO, error);
    }
    return;
  }

  [self attachContainerViewToController];
  [self removeMeasurementHostView];

  [_controller setupAnchorViewInView:presentingViewController.view];
  [_controller setupSheetSizing];
  [_controller setupSheetProps];

  // Detect before measuring so a first-time detection doesn't shift sizes mid-animation.
  [self setupScrollable];

  // Measure synchronously so the presentation starts at the right height —
  // async size reports would otherwise land mid-animation and force a
  // detent retarget that snaps the presentation stack.
  if (_containerView) {
    _controller.contentHeight = @([_containerView contentHeight]);
    _controller.headerHeight = @([_containerView headerHeight]);
    [self syncFooterMetrics];
    _controller.peekContentHeight = @([_containerView peekContentHeight]);
  }
  _pendingSizeChange = NO;

  [self refreshFooterBottomInset];
  [_controller setupSheetDetents];
  [_controller setupActiveDetentWithIndex:index];

  [_screensEventObserver capturePresenterScreenFromView:self];
  [_screensEventObserver startObservingWithState:_state.get()->getData()];

  [presentingViewController presentViewController:_controller
                                         animated:animated
                                       completion:^{
                                         if (completion) {
                                           completion(YES, nil);
                                         }
                                       }];
}

- (void)resizeToIndex:(NSInteger)index completion:(nullable TrueSheetCompletionBlock)completion {
  if (!_controller.isPresented) {
    RCTLogWarn(@"TrueSheet: Cannot resize. Sheet is not presented.");
    if (completion) {
      completion(YES, nil);
    }
    return;
  }

  [_controller.sheetPresentationController animateChanges:^{
    [self->_controller resizeToDetentIndex:index];
  }];

  if (completion) {
    completion(YES, nil);
  }
}

- (TrueSheetViewController *)viewController {
  return _controller;
}

- (void)emitDismissedPosition {
  [TrueSheetStateEvents emitPositionChange:_eventEmitter
                                     index:-1
                                  position:_controller.screenHeight
                                    detent:0
                                  realtime:NO];
}

- (void)dismissAnimated:(BOOL)animated completion:(nullable TrueSheetCompletionBlock)completion {
  if (_controller.isBeingDismissed || !_controller.isPresented) {
    RCTLogWarn(@"TrueSheet: sheet is already dismissed. No need to dismiss it again.");

    if (completion) {
      completion(YES, nil);
    }
    return;
  }

  // Dismiss from the presenting view controller to dismiss this sheet and all its children
  UIViewController *presenter = _controller.presentingViewController;
  [presenter dismissViewControllerAnimated:animated
                                completion:^{
                                  if (completion) {
                                    completion(YES, nil);
                                  }
                                }];
}

- (void)dismissStackAnimated:(BOOL)animated completion:(nullable TrueSheetCompletionBlock)completion {
  if (_controller.isBeingDismissed || !_controller.isPresented) {
    RCTLogWarn(@"TrueSheet: sheet is already dismissed. No need to dismiss it again.");

    if (completion) {
      completion(YES, nil);
    }
    return;
  }

  // Only dismiss presented children, not this sheet itself
  if (!_controller.presentedViewController) {
    if (completion) {
      completion(YES, nil);
    }
    return;
  }

  // Calling dismiss on _controller dismisses all VCs presented on top of it, but keeps _controller presented
  [_controller dismissViewControllerAnimated:animated
                                  completion:^{
                                    if (completion) {
                                      completion(YES, nil);
                                    }
                                  }];
}

#pragma mark - TrueSheetContainerViewDelegate

/**
 * Debounced sheet update to handle rapid content/header size changes.
 */
- (void)setupSheetDetentsForSizeChange {
  // Keep the footer's absorbed inset in sync with the latest measured heights
  // even before presenting, so the sheet presents at its final size.
  [self refreshFooterBottomInset];

  // Retargeting the in-flight presentation makes UIKit snap the whole stack
  // (including the sheet behind) instead of animating. Defer to didPresent —
  // presentAtIndex measured synchronously, so this is usually a no-op.
  if (_controller.isBeingPresented) {
    _pendingSizeChange = YES;
    return;
  }

  // Not presented: presentAtIndex measures at present time.
  // Dismissing: the sheet is going away — touching detents perturbs the
  // presentation stack, visibly glitching the sheet behind.
  if (!_controller.isPresented || _controller.isBeingDismissed)
    return;

  if (_isSheetUpdatePending)
    return;

  _isSheetUpdatePending = YES;

  dispatch_async(dispatch_get_main_queue(), ^{
    self->_isSheetUpdatePending = NO;
    if (!self->_containerView || self->_controller.isBeingDismissed)
      return;

    // Refresh here (not just on peek size events) since the peek's offset
    // within the content can change without its own size changing.
    self->_controller.peekContentHeight = @([self->_containerView peekContentHeight]);
    [self refreshFooterBottomInset];
    [self->_controller setupSheetDetentsForSizeChange];
  });
}

- (void)containerViewContentDidChangeSize:(CGSize)newSize {
  _controller.contentHeight = @(newSize.height);
  [self setupSheetDetentsForSizeChange];
  [self scheduleInitialPresentationAfterMeasurement];
}

- (void)containerViewHeaderDidChangeSize:(CGSize)newSize {
  _controller.headerHeight = @(newSize.height);
  [self setupSheetDetentsForSizeChange];
  [self scheduleInitialPresentationAfterMeasurement];
}

- (void)containerViewFooterDidChangeSize:(CGSize)newSize {
  [self syncFooterMetrics];
  [self setupSheetDetentsForSizeChange];
  [_controller setupAccessibilityContainer];
  [self scheduleInitialPresentationAfterMeasurement];
}

- (void)containerViewPeekDidChangeSize:(CGSize)newSize {
  [self setupSheetDetentsForSizeChange];
  [self scheduleInitialPresentationAfterMeasurement];
}

// When the ScrollView changes (e.g. conditional remount), re-detect the new ScrollView.
- (void)containerViewScrollViewDidChange {
  [self setupScrollable];
}

#pragma mark - TrueSheetViewControllerDelegate

- (void)viewControllerWillPresentAtIndex:(NSInteger)index position:(CGFloat)position detent:(CGFloat)detent {
  _controller.activeDetentIndex = index;
  [TrueSheetLifecycleEvents emitWillPresent:_eventEmitter index:index position:position detent:detent];
}

- (void)viewControllerDidPresentAtIndex:(NSInteger)index position:(CGFloat)position detent:(CGFloat)detent {
  [_containerView setupKeyboardObserverWithViewController:_controller];
  [TrueSheetLifecycleEvents emitDidPresent:_eventEmitter index:index position:position detent:detent];

  if (_pendingPropsUpdate) {
    _pendingPropsUpdate = NO;
    [self applySheetPropsUpdate];
  }

  if (_pendingSizeChange) {
    _pendingSizeChange = NO;
    [self setupSheetDetentsForSizeChange];
  }
}

- (void)viewControllerDidDrag:(UIGestureRecognizerState)state
                        index:(NSInteger)index
                     position:(CGFloat)position
                       detent:(CGFloat)detent {
  switch (state) {
    case UIGestureRecognizerStateBegan:
      [TrueSheetDragEvents emitDragBegin:_eventEmitter index:index position:position detent:detent];
      break;
    case UIGestureRecognizerStateChanged:
      [TrueSheetDragEvents emitDragChange:_eventEmitter index:index position:position detent:detent];
      break;
    case UIGestureRecognizerStateEnded:
    case UIGestureRecognizerStateCancelled:
      [TrueSheetDragEvents emitDragEnd:_eventEmitter index:index position:position detent:detent];
      break;
    default:
      break;
  }
}

- (void)viewControllerWillDismiss {
  if (!_dismissedByNavigation) {
    [TrueSheetLifecycleEvents emitWillDismiss:_eventEmitter];
  }
}

- (void)viewControllerDidDismiss {
  [_containerView cleanupKeyboardObserver];
  if (!_dismissedByNavigation) {
    _dismissedByNavigation = NO;
    _pendingNavigationRepresent = NO;

    _controller.activeDetentIndex = -1;
    [TrueSheetLifecycleEvents emitDidDismiss:_eventEmitter];
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    [self stageContainerViewForMeasurement];
  });
}

- (void)viewControllerDidChangeDetent:(NSInteger)index position:(CGFloat)position detent:(CGFloat)detent {
  if (_controller.activeDetentIndex != index) {
    _controller.activeDetentIndex = index;
  }
  [TrueSheetStateEvents emitDetentChange:_eventEmitter index:index position:position detent:detent];
}

- (void)viewControllerDidChangePosition:(CGFloat)index
                               position:(CGFloat)position
                                 detent:(CGFloat)detent
                               realtime:(BOOL)realtime {
  [TrueSheetStateEvents emitPositionChange:_eventEmitter index:index position:position detent:detent realtime:realtime];
}

- (void)viewControllerDidChangeSize:(CGSize)size {
  [self updateStateWithSize:size];
}

- (void)viewControllerSafeAreaInsetsDidChange {
  [self refreshFooterBottomInset];
}

- (void)viewControllerWillFocus {
  [TrueSheetFocusEvents emitWillFocus:_eventEmitter];
}

- (void)viewControllerDidFocus {
  [TrueSheetFocusEvents emitDidFocus:_eventEmitter];
}

- (void)viewControllerWillBlur {
  [TrueSheetFocusEvents emitWillBlur:_eventEmitter];
}

- (void)viewControllerDidBlur {
  [TrueSheetFocusEvents emitDidBlur:_eventEmitter];
}

#pragma mark - RNScreensEventObserverDelegate

- (void)presenterScreenWillDisappear {
  if (_controller.isPresented && !_controller.isBeingDismissed) {
    _dismissedByNavigation = YES;
    [self dismissAnimated:YES completion:nil];
  }
}

- (void)presenterScreenWillAppear {
  if (_dismissedByNavigation && !_controller.isPresented && !_controller.isBeingPresented) {
    _dismissedByNavigation = NO;

    if (self.window) {
      [self presentAtIndex:_controller.activeDetentIndex animated:YES completion:nil];
    } else {
      _pendingNavigationRepresent = YES;
    }
  }
}

- (void)presenterInteractiveDismissDidBegin {
  [_controller beginInteractiveDismiss];
}

- (void)presenterInteractiveDismissDidUpdate:(CGFloat)progress {
  [_controller updateInteractiveDismiss:progress];
}

- (void)presenterInteractiveDismissDidEnd:(BOOL)cancelled duration:(NSTimeInterval)duration {
  if (cancelled) {
    [_controller cancelInteractiveDismissWithDuration:duration];
    return;
  }

  _dismissedByNavigation = YES;
  __weak __typeof(self) weakSelf = self;
  [_controller finishInteractiveDismissWithDuration:duration
                                         completion:^{
                                           [weakSelf dismissAnimated:NO completion:nil];
                                         }];
}

#pragma mark - Private Helpers

- (void)scheduleInitialPresentationAfterMeasurement {
  if (!_isInitialMeasurementPending)
    return;

  NSUInteger generation = ++_initialMeasurementGeneration;
  CFTimeInterval remaining = MAX(0.0, _initialMeasurementDeadline - CACurrentMediaTime());
  NSTimeInterval delay = MIN(InitialMeasurementSettleInterval, remaining);

  __weak __typeof(self) weakSelf = self;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delay * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    __typeof(self) strongSelf = weakSelf;
    if (!strongSelf || !strongSelf->_isInitialMeasurementPending ||
        generation != strongSelf->_initialMeasurementGeneration) {
      return;
    }

    if (!strongSelf->_measurementViewController && strongSelf->_initialMeasurementDeadline > CACurrentMediaTime() &&
        [strongSelf stageContainerViewInMeasurementController]) {
      [strongSelf scheduleInitialPresentationAfterMeasurement];
      return;
    }

    strongSelf->_isInitialMeasurementPending = NO;

    if (strongSelf->_controller.isPresented || strongSelf->_controller.isBeingPresented)
      return;

    [strongSelf presentAtIndex:strongSelf->_initialDetentIndex
                      animated:strongSelf->_initialDetentAnimated
                    completion:^(BOOL success, NSError *_Nullable error) {
                      // Present can fail if the view detached while waiting —
                      // reset so the next attach/prop update retries.
                      if (!success) {
                        strongSelf->_didInitiallyPresent = NO;
                      }
                    }];
  });
}

- (void)cancelPendingInitialPresentation {
  _isInitialMeasurementPending = NO;
  _initialMeasurementDeadline = 0;
  _initialMeasurementGeneration++;
}

- (void)stageContainerViewForMeasurement {
  if (!_containerView || !self.window || _controller.isPresented || _controller.isBeingPresented ||
      _controller.isBeingDismissed || _measurementViewController || _containerView.superview == _measurementHostView) {
    return;
  }

  UIViewController *presentingViewController = [self findPresentingViewController];
  UIView *presenterView = presentingViewController.view;
  if (!presentingViewController || presenterView.window != self.window) {
    return;
  }

  if (!_measurementHostView) {
    _measurementHostView = [[UIView alloc] initWithFrame:presenterView.bounds];
    _measurementHostView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _measurementHostView.alpha = 0;
    _measurementHostView.userInteractionEnabled = NO;
    _measurementHostView.accessibilityElementsHidden = YES;
    [presenterView insertSubview:_measurementHostView atIndex:0];
  }

  _containerView.frame = _measurementHostView.bounds;
  [_measurementHostView addSubview:_containerView];
  [_containerView setNeedsLayout];
  [_containerView layoutIfNeeded];
}

- (BOOL)stageContainerViewInMeasurementController {
  if (!_containerView || !_measurementHostView || !_measurementHostView.superview || _measurementViewController) {
    return NO;
  }

  UIViewController *presentingViewController = [self findPresentingViewController];
  if (!presentingViewController || presentingViewController.view.window != self.window) {
    return NO;
  }

  // Native-backed children can derive intrinsic size from their containing
  // view controller. Recreate that transition inside the hidden host before
  // UIKit resolves the initial measured detent. A disposable controller keeps
  // the real sheet controller's first containment transition reserved for its
  // actual presentation.
  _measurementViewController = [[UIViewController alloc] init];
  [presentingViewController addChildViewController:_measurementViewController];
  _measurementViewController.view.frame = _measurementHostView.bounds;
  _measurementViewController.view.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  [_measurementHostView addSubview:_measurementViewController.view];
  [_measurementViewController didMoveToParentViewController:presentingViewController];

  _containerView.frame = _measurementViewController.view.bounds;
  [_measurementViewController.view addSubview:_containerView];
  [_containerView setNeedsLayout];
  [_containerView layoutIfNeeded];
  return YES;
}

- (void)attachContainerViewToController {
  if (!_containerView || _containerView.superview == _controller.view) {
    return;
  }

  [_controller.view addSubview:_containerView];
  [_controller.view bringSubviewToFront:_containerView];
}

- (void)removeMeasurementHostView {
  if (_measurementViewController.parentViewController) {
    [_measurementViewController willMoveToParentViewController:nil];
    [_measurementViewController.view removeFromSuperview];
    [_measurementViewController removeFromParentViewController];
  }

  _measurementViewController = nil;
  [_measurementHostView removeFromSuperview];
  _measurementHostView = nil;
}

- (void)setupScrollable {
  if (!_containerView)
    return;

  _containerView.scrollableOptions = _scrollableOptions;
  _containerView.scrollableHandle = _scrollableHandle;
  _containerView.contentInsetAdjustment = (_scrollableOptions ? _scrollableOptions.contentInsetAdjustment : YES) &&
                                          _insetAdjustment == TrueSheetViewInsetAdjustment::Automatic;
  [self refreshFooterBottomInset];
  [_containerView setupScrollable];
}

// footerHeight and appliedFooterBottomInset must stay paired — detent math
// subtracts exactly the inset baked into the measured footer height (see
// autoDetentBottomInset/peekDetentBottomInset).
- (void)syncFooterMetrics {
  _controller.footerHeight = @([_containerView footerHeight]);
  _controller.appliedFooterBottomInset = [_containerView footerAppliedBottomInset];
}

// Recomputes the inset the footer absorbs and pushes it down. The inset
// depends on measured heights and detents (see maxNaturalDetentHeight), so
// this runs on size and detent changes — not just prop updates.
- (void)refreshFooterBottomInset {
  if (!_containerView)
    return;

  // appliedFooterBottomInset is NOT set here — it tracks what's actually
  // baked into the footer's measured height (reported with its layout), not
  // what was just pushed. Setting it at push time desyncs the pair and lets
  // a seeded inset read as natural content height (see maxNaturalDetentHeight).
  CGFloat inset = _controller.footerBottomInset;
  _containerView.footerBottomInset = inset;

  // Publish the inset so a footer set later (e.g. navigation setOptions) is
  // padded on its very first layout instead of resizing the sheet twice.
  if (_insetAdjustment == TrueSheetViewInsetAdjustment::Automatic) {
    TrueSheetInsets::setBottomSafeArea(inset);
  }
}

- (void)applySheetPropsUpdate {
  BOOL pendingLayoutUpdate = _pendingLayoutUpdate;
  _pendingLayoutUpdate = NO;

  if (_pendingDetents) {
    _controller.detents = _pendingDetents;
    _pendingDetents = nil;
    [self refreshFooterBottomInset];
  }

  UIView *presenterView = _controller.presentingViewController.view;
  [_controller setupAnchorViewInView:presenterView];

  [_controller setupSheetSizing];

  [_controller.sheetPresentationController animateChanges:^{
    [self->_controller setupSheetProps];
    if (pendingLayoutUpdate) {
      [self->_controller setupSheetDetentsForDetentsChange];
    } else {
      [self->_controller setupSheetDetents];
    }
    [self->_controller applyActiveDetent];
  }];
  [_controller setupDraggable];
}

- (UIViewController *)findPresentingViewController {
  if (!self.window)
    return nil;

  UIViewController *rootViewController = self.window.rootViewController;
  if (!rootViewController)
    return nil;

  // Find topmost presented view controller that is not being dismissed
  while (rootViewController.presentedViewController) {
    UIViewController *presented = rootViewController.presentedViewController;

    // Skip any view controller that is being dismissed
    if (presented.isBeingDismissed) {
      break;
    }
    rootViewController = presented;
  }

  return rootViewController;
}

@end

Class<RCTComponentViewProtocol> TrueSheetViewCls(void) {
  return TrueSheetView.class;
}

#endif  // RCT_NEW_ARCH_ENABLED
