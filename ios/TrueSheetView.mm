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
#import "utils/LayoutUtil.h"

#import <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>
#import <react/renderer/components/TrueSheetSpec/RCTComponentViewHelpers.h>
#import <react/renderer/components/TrueSheetSpec/TrueSheetViewComponentDescriptor.h>
#import <react/renderer/components/TrueSheetSpec/TrueSheetViewShadowNode.h>
#import <react/renderer/components/TrueSheetSpec/TrueSheetViewState.h>

#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>
#import <React/RCTLog.h>
#import <React/RCTSurfaceTouchHandler.h>
#import <React/RCTUtils.h>
#import <cxxreact/ReactNativeVersion.h>
#import <react/renderer/core/State.h>

using namespace facebook::react;

@interface TrueSheetView () <TrueSheetViewControllerDelegate,
  TrueSheetContainerViewDelegate,
  RNScreensEventObserverDelegate>
@end

@implementation TrueSheetView {
  TrueSheetContainerView *_containerView;
  TrueSheetViewController *_controller;
  RCTSurfaceTouchHandler *_touchHandler;
  TrueSheetViewShadowNode::ConcreteState::Shared _state;
  UIView *_snapshotView;
  CGSize _lastStateSize;
  NSInteger _initialDetentIndex;
  NSInteger _insetAdjustment;
  BOOL _scrollable;
  NSDictionary *_scrollableOptions;
  BOOL _initialDetentAnimated;
  BOOL _isSheetUpdatePending;
  BOOL _pendingLayoutUpdate;
  BOOL _didInitiallyPresent;
  BOOL _dismissedByNavigation;
  BOOL _pendingNavigationRepresent;
  BOOL _pendingMountEvent;
  BOOL _pendingSizeChange;
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
    _scrollable = NO;
    _isSheetUpdatePending = NO;

    _screensEventObserver = [[RNScreensEventObserver alloc] init];
    _screensEventObserver.delegate = self;
  }
  return self;
}

- (void)didMoveToWindow {
  [super didMoveToWindow];

  if (!self.window)
    return;

  if (self.tag > 0) {
    [TrueSheetModule registerView:self withTag:@(self.tag)];
  }

  if (_pendingNavigationRepresent && !_controller.isPresented) {
    _pendingNavigationRepresent = NO;
    [self presentAtIndex:_controller.activeDetentIndex animated:YES completion:nil];
    return;
  }

  if (_initialDetentIndex >= 0 && !_didInitiallyPresent) {
    UIViewController *vc = [self findPresentingViewController];

    // Only present if the view controller is in the same window and not being dismissed
    if (vc && vc.view.window == self.window && !_controller.isBeingDismissed) {
      _didInitiallyPresent = YES;
      [self presentAtIndex:_initialDetentIndex animated:_initialDetentAnimated completion:nil];
    } else {
      // Animate next time when sheet finally moves to the correct window
      _initialDetentAnimated = YES;
    }
  }
}

- (void)dealloc {
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
  _controller.detents = detents;

  // Background color
  _controller.backgroundColor = RCTUIColorFromSharedColor(newProps.backgroundColor);

  // Blur tint
  _controller.backgroundBlur = (NSInteger)newProps.backgroundBlur;

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
  _controller.anchor = (NSInteger)newProps.anchor;

  _controller.grabber = newProps.grabber;

  // Grabber options - check if any non-default values are set
  const auto &grabberOpts = newProps.grabberOptions;
  UIColor *grabberColor = RCTUIColorFromSharedColor(grabberOpts.color);
  BOOL hasGrabberOptions = grabberOpts.width > 0 || grabberOpts.height > 0 || grabberOpts.topMargin > 0 ||
                           grabberOpts.cornerRadius >= 0 || grabberColor != nil || !grabberOpts.adaptive;

  if (hasGrabberOptions) {
    NSMutableDictionary *options = [NSMutableDictionary dictionary];

    if (grabberOpts.width > 0) {
      options[@"width"] = @(grabberOpts.width);
    }
    if (grabberOpts.height > 0) {
      options[@"height"] = @(grabberOpts.height);
    }
    if (grabberOpts.topMargin > 0) {
      options[@"topMargin"] = @(grabberOpts.topMargin);
    }
    if (grabberOpts.cornerRadius >= 0) {
      options[@"cornerRadius"] = @(grabberOpts.cornerRadius);
    }
    if (grabberColor) {
      options[@"color"] = grabberColor;
    }
    options[@"adaptive"] = @(grabberOpts.adaptive);

    _controller.grabberOptions = options;
  } else {
    _controller.grabberOptions = nil;
  }

  _controller.pageSizing = newProps.pageSizing;
  _controller.modalInPresentation = !newProps.dismissible;
  _controller.draggable = newProps.draggable;
  _controller.dimmed = newProps.dimmed;

  if (newProps.dimmedDetentIndex >= 0) {
    _controller.dimmedDetentIndex = @(newProps.dimmedDetentIndex);
  }

  _initialDetentIndex = newProps.initialDetentIndex;
  _initialDetentAnimated = newProps.initialDetentAnimated;
  _scrollable = newProps.scrollable;

  const auto &scrollableOpts = newProps.scrollableOptions;
  BOOL hasScrollableOptions = scrollableOpts.keyboardScrollOffset > 0;

  if (hasScrollableOptions) {
    NSMutableDictionary *options = [NSMutableDictionary dictionary];
    if (scrollableOpts.keyboardScrollOffset > 0) {
      options[@"keyboardScrollOffset"] = @(scrollableOpts.keyboardScrollOffset);
    }
    _scrollableOptions = options;
  } else {
    _scrollableOptions = nil;
  }

  _insetAdjustment = (NSInteger)newProps.insetAdjustment;
  _controller.insetAdjustment = _insetAdjustment;

  if (_containerView) {
    _containerView.scrollableEnabled = _scrollable;
    _containerView.insetAdjustment = _insetAdjustment;
    _containerView.scrollableOptions = _scrollableOptions;
  }
}

- (void)updateState:(const State::Shared &)state oldState:(const State::Shared &)oldState {
  _state = std::static_pointer_cast<TrueSheetViewShadowNode::ConcreteState const>(state);

  if (_controller) {
    // Initialize with _controller size to set initial width
    [self viewControllerDidChangeSize:_controller.view.frame.size];
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

#if REACT_NATIVE_VERSION_MINOR >= 82
  // TODO: RN 0.82+ processes state updates in the same layout pass (synchronous).
  // Once stable, we can drop native layout constraints in favor of synchronous Yoga layout.
  _state->updateState(std::move(stateData), facebook::react::EventQueue::UpdateMode::unstable_Immediate);
#else
  _state->updateState(std::move(stateData));
#endif
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask {
  [super finalizeUpdates:updateMask];

  // Emit pending mount event now that eventEmitter is available
  if (_pendingMountEvent && (updateMask & RNComponentViewUpdateMaskEventEmitter)) {
    _pendingMountEvent = NO;
    [TrueSheetLifecycleEvents emitMount:_eventEmitter];
  }

  if (!(updateMask & RNComponentViewUpdateMaskProps) || !_controller)
    return;

  if (_containerView) {
    [_containerView setupScrollable];
  }

  if (_controller.isPresented) {
    BOOL pendingLayoutUpdate = _pendingLayoutUpdate;
    _pendingLayoutUpdate = NO;

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
  } else if (_initialDetentIndex >= 0) {
    _pendingLayoutUpdate = NO;
  }
}

- (void)prepareForRecycle {
  [super prepareForRecycle];

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

  _containerView.delegate = nil;
  [_touchHandler detachFromView:_containerView];
  [LayoutUtil unpinView:_containerView fromParentView:nil];
  [_containerView removeFromSuperview];

  _containerView = nil;
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
  [LayoutUtil pinView:_containerView toParentView:_controller.view edges:UIRectEdgeAll];
  [_controller.view bringSubviewToFront:_containerView];

  CGFloat contentHeight = [_containerView contentHeight];
  if (contentHeight > 0) {
    _controller.contentHeight = @(contentHeight);
  }

  CGFloat headerHeight = [_containerView headerHeight];
  if (headerHeight > 0) {
    _controller.headerHeight = @(headerHeight);
  }

  _containerView.scrollableEnabled = _scrollable;
  _containerView.insetAdjustment = _insetAdjustment;
  _containerView.scrollableOptions = _scrollableOptions;
  [_containerView setupScrollable];

  if (_eventEmitter) {
    [TrueSheetLifecycleEvents emitMount:_eventEmitter];
  } else {
    _pendingMountEvent = YES;
  }
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

  [_controller setupAnchorViewInView:presentingViewController.view];
  [_controller setupSheetSizing];
  [_controller setupSheetProps];
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
  [self viewControllerDidChangePosition:-1 position:_controller.screenHeight detent:0 realtime:NO];
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
  if (_isSheetUpdatePending)
    return;

  if (!_controller.isPresented) {
    _pendingSizeChange = YES;
    return;
  }

  _isSheetUpdatePending = YES;

  dispatch_async(dispatch_get_main_queue(), ^{
    self->_isSheetUpdatePending = NO;
    if (!self->_containerView)
      return;

    [self->_controller setupSheetDetentsForSizeChange];
  });
}

- (void)containerViewContentDidChangeSize:(CGSize)newSize {
  _controller.contentHeight = @(newSize.height);
  [self setupSheetDetentsForSizeChange];
}

- (void)containerViewHeaderDidChangeSize:(CGSize)newSize {
  _controller.headerHeight = @(newSize.height);
  [self setupSheetDetentsForSizeChange];
}

#pragma mark - TrueSheetViewControllerDelegate

- (void)viewControllerWillPresentAtIndex:(NSInteger)index position:(CGFloat)position detent:(CGFloat)detent {
  _controller.activeDetentIndex = index;
  [TrueSheetLifecycleEvents emitWillPresent:_eventEmitter index:index position:position detent:detent];
}

- (void)viewControllerDidPresentAtIndex:(NSInteger)index position:(CGFloat)position detent:(CGFloat)detent {
  [_containerView setupKeyboardObserverWithViewController:_controller];
  [TrueSheetLifecycleEvents emitDidPresent:_eventEmitter index:index position:position detent:detent];

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
  // TODO: Explicit screen height for now until synchronous layout is supported.
  CGSize effectiveSize = CGSizeMake(size.width, _controller.screenHeight);

  [self updateStateWithSize:effectiveSize];
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

#pragma mark - Private Helpers

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
