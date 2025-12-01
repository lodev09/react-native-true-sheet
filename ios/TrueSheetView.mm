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
#import "events/TrueSheetDragEvents.h"
#import "events/TrueSheetFocusEvents.h"
#import "events/TrueSheetLifecycleEvents.h"
#import "events/TrueSheetStateEvents.h"
#import "utils/LayoutUtil.h"
#import "utils/WindowUtil.h"

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
#import <react/renderer/core/State.h>

using namespace facebook::react;

@interface TrueSheetView () <TrueSheetViewControllerDelegate, TrueSheetContainerViewDelegate>
@end

@implementation TrueSheetView {
  TrueSheetContainerView *_containerView;
  TrueSheetViewController *_controller;
  RCTSurfaceTouchHandler *_touchHandler;
  TrueSheetViewShadowNode::ConcreteState::Shared _state;
  CGSize _lastStateSize;
  NSInteger _initialDetentIndex;
  BOOL _scrollable;
  BOOL _initialDetentAnimated;
  BOOL _isSheetUpdatePending;

  // Waiting for presented view controller to dismiss
  NSTimer *_pendingPresentTimer;
  __weak UIViewController *_pendingPresentBlockingVC;
  NSInteger _pendingPresentIndex;
  BOOL _pendingPresentAnimated;
  TrueSheetCompletionBlock _pendingPresentCompletion;
}

#pragma mark - Initialization

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const TrueSheetViewProps>();
    _props = defaultProps;

    _controller = [[TrueSheetViewController alloc] init];
    _controller.delegate = self;

    _touchHandler = [[RCTSurfaceTouchHandler alloc] init];
    _containerView = nil;
    _lastStateSize = CGSizeZero;
    _initialDetentIndex = -1;
    _initialDetentAnimated = YES;
    _scrollable = NO;
    _isSheetUpdatePending = NO;

    _pendingPresentTimer = nil;
    _pendingPresentBlockingVC = nil;
    _pendingPresentIndex = -1;
    _pendingPresentAnimated = YES;
    _pendingPresentCompletion = nil;
  }
  return self;
}

- (void)didMoveToWindow {
  [super didMoveToWindow];

  if (!self.window)
    return;

  // Register with TurboModule when tag is set
  if (self.tag > 0) {
    [TrueSheetModule registerView:self withTag:@(self.tag)];
  }
}

- (void)dealloc {
  [self cancelPendingPresent];

  if (_controller && _controller.presentingViewController) {
    [_controller dismissViewControllerAnimated:NO completion:nil];
  }

  _controller.delegate = nil;
  _controller = nil;

  [TrueSheetModule unregisterViewWithTag:@(self.tag)];
}

- (void)cancelPendingPresent {
  if (_pendingPresentTimer) {
    [_pendingPresentTimer invalidate];
    _pendingPresentTimer = nil;
  }
  _pendingPresentBlockingVC = nil;
  _pendingPresentIndex = -1;
  _pendingPresentCompletion = nil;
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
  _controller.detents = detents;

  // Background color
  _controller.backgroundColor =
    newProps.background == 0 ? nil : RCTUIColorFromSharedColor(SharedColor(newProps.background));

  // Blur tint
  _controller.blurTint = !newProps.blurTint.empty() ? RCTNSStringFromString(newProps.blurTint) : nil;

  // Blur options
  const auto &blurOpts = newProps.blurOptions;
  _controller.blurIntensity = blurOpts.intensity >= 0 ? @(blurOpts.intensity) : nil;
  _controller.blurInteraction = blurOpts.interaction;

  // Corner radius
  _controller.cornerRadius = newProps.cornerRadius < 0 ? nil : @(newProps.cornerRadius);

  // Max height
  if (newProps.maxHeight != 0.0) {
    _controller.maxHeight = @(newProps.maxHeight);
  }

  _controller.grabber = newProps.grabber;

  // Grabber options - check if any non-default values are set
  const auto &grabberOpts = newProps.grabberOptions;
  BOOL hasGrabberOptions = grabberOpts.width > 0 || grabberOpts.height > 0 || grabberOpts.topMargin > 0 ||
                           grabberOpts.cornerRadius >= 0 || grabberOpts.color != 0;

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
    if (grabberOpts.color != 0) {
      options[@"color"] = RCTUIColorFromSharedColor(SharedColor(grabberOpts.color));
    }

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

  if (_containerView) {
    _containerView.scrollViewPinningEnabled = _scrollable;
  }
}

- (void)updateState:(const State::Shared &)state oldState:(const State::Shared &)oldState {
  _state = std::static_pointer_cast<TrueSheetViewShadowNode::ConcreteState const>(state);

  if (_controller) {
    [self updateStateWithSize:_controller.view.frame.size];
  }
}

/**
 * Updates Fabric state with container width for Yoga layout.
 */
- (void)updateStateWithSize:(CGSize)size {
  if (!_state || size.width <= 0 || size.width == _lastStateSize.width)
    return;

  _lastStateSize = size;
  _state->updateState([=](TrueSheetViewShadowNode::ConcreteState::Data const &oldData)
                        -> TrueSheetViewShadowNode::ConcreteState::SharedData {
    auto newData = oldData;
    newData.containerWidth = static_cast<float>(size.width);
    return std::make_shared<TrueSheetViewShadowNode::ConcreteState::Data const>(newData);
  });
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask {
  [super finalizeUpdates:updateMask];

  if (!(updateMask & RNComponentViewUpdateMaskProps) || !_controller)
    return;

  if (_containerView) {
    [_containerView setupContentScrollViewPinning];
  }

  if (_controller.isPresented) {
    [_controller.sheetPresentationController animateChanges:^{
      [self->_controller setupSheetProps];
      [self->_controller setupSheetDetents];
      [self->_controller applyActiveDetent];
    }];
    [_controller updateDraggable];
  } else if (_initialDetentIndex >= 0) {
    [self presentInitialDetentAtIndex:_initialDetentIndex animated:_initialDetentAnimated];
  }
}

- (void)prepareForRecycle {
  [super prepareForRecycle];

  [self cancelPendingPresent];

  _lastStateSize = CGSizeZero;

  if (_controller && _controller.presentingViewController) {
    [_controller dismissViewControllerAnimated:YES completion:nil];
  }

  [TrueSheetModule unregisterViewWithTag:@(self.tag)];
}

#pragma mark - Child Component Mounting

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  if (![childComponentView isKindOfClass:[TrueSheetContainerView class]])
    return;

  if (_containerView != nil) {
    RCTLogWarn(@"TrueSheet: Sheet can only have one container component.");
    return;
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

  _containerView.scrollViewPinningEnabled = _scrollable;
  [_containerView setupContentScrollViewPinning];

  [TrueSheetLifecycleEvents emitMount:_eventEmitter];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  if (![childComponentView isKindOfClass:[TrueSheetContainerView class]])
    return;

  _containerView.delegate = nil;

  if (_touchHandler) {
    [_touchHandler detachFromView:_containerView];
  }

  [LayoutUtil unpinView:_containerView fromParentView:nil];
  [_containerView removeFromSuperview];
  _containerView = nil;
}

#pragma mark - TurboModule Methods

- (void)presentAtIndex:(NSInteger)index
              animated:(BOOL)animated
            completion:(nullable TrueSheetCompletionBlock)completion {
  if (_controller.isBeingPresented) {
    RCTLogWarn(@"TrueSheet: sheet is being presented. Wait for it to transition before presenting again.");
    return;
  }

  if (_controller.isPresented) {
    [_controller.sheetPresentationController animateChanges:^{
      [self->_controller resizeToDetentIndex:index];
    }];
    if (completion) {
      completion(YES, nil);
    }
    return;
  }

  UIViewController *presentingViewController = [self findTopmostViewController];
  if (!presentingViewController) {
    NSError *error = [NSError errorWithDomain:@"com.lodev09.TrueSheet"
                                         code:1001
                                     userInfo:@{NSLocalizedDescriptionKey : @"No presenting view controller found"}];
    if (completion) {
      completion(NO, error);
    }
    return;
  }

  [_controller setupSheetProps];
  [_controller setupSheetDetents];
  [_controller setupActiveDetentWithIndex:index];

  [presentingViewController presentViewController:_controller
                                         animated:animated
                                       completion:^{
                                         if (completion) {
                                           completion(YES, nil);
                                         }
                                       }];
}

- (void)dismissAnimated:(BOOL)animated completion:(nullable TrueSheetCompletionBlock)completion {
  if (_controller.isBeingDismissed) {
    RCTLogWarn(@"TrueSheet: sheet is being dismissed. No need to dismiss it again.");
    return;
  }

  if (!_controller.isPresented) {
    if (completion) {
      completion(YES, nil);
    }
    return;
  }

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
- (void)updateSheetIfNeeded {
  if (!_controller.isPresented || _isSheetUpdatePending)
    return;

  _isSheetUpdatePending = YES;

  dispatch_async(dispatch_get_main_queue(), ^{
    self->_isSheetUpdatePending = NO;

    [self->_controller.sheetPresentationController animateChanges:^{
      [self->_controller setupSheetDetents];
    }];
  });
}

- (void)containerViewContentDidChangeSize:(CGSize)newSize {
  _controller.contentHeight = @(newSize.height);
  [self updateSheetIfNeeded];
}

- (void)containerViewHeaderDidChangeSize:(CGSize)newSize {
  _controller.headerHeight = @(newSize.height);
  [self updateSheetIfNeeded];
}

#pragma mark - TrueSheetViewControllerDelegate

- (void)viewControllerWillPresentAtIndex:(NSInteger)index position:(CGFloat)position detent:(CGFloat)detent {
  _controller.activeDetentIndex = index;
  [TrueSheetLifecycleEvents emitWillPresent:_eventEmitter index:index position:position detent:detent];
}

- (void)viewControllerDidPresentAtIndex:(NSInteger)index position:(CGFloat)position detent:(CGFloat)detent {
  [TrueSheetLifecycleEvents emitDidPresent:_eventEmitter index:index position:position detent:detent];
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
  [TrueSheetLifecycleEvents emitWillDismiss:_eventEmitter];
}

- (void)viewControllerDidDismiss {
  _controller.activeDetentIndex = -1;
  [TrueSheetLifecycleEvents emitDidDismiss:_eventEmitter];
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

#pragma mark - Private Helpers

- (UIViewController *)findTopmostViewController {
  UIWindow *keyWindow = [WindowUtil keyWindow];
  if (!keyWindow)
    return nil;

  UIViewController *vc = keyWindow.rootViewController;
  while (vc.presentedViewController && !vc.presentedViewController.isBeingDismissed) {
    vc = vc.presentedViewController;
  }

  return vc;
}

/**
 * Presents the sheet at the initial detent index, waiting for any presented view controller to dismiss first.
 */
- (void)presentInitialDetentAtIndex:(NSInteger)index animated:(BOOL)animated {
  if (_controller.isPresented || _controller.isBeingPresented || _pendingPresentBlockingVC)
    return;

  UIViewController *topmostVC = [self findTopmostViewController];
  if (!topmostVC)
    return;

  UIWindow *keyWindow = [WindowUtil keyWindow];
  UIViewController *rootVC = keyWindow.rootViewController;

  // If there's a presented VC, wait for it to dismiss
  if (topmostVC != rootVC) {
    _pendingPresentBlockingVC = topmostVC;
    _pendingPresentIndex = index;
    _pendingPresentAnimated = animated;
    _pendingPresentCompletion = nil;

    _pendingPresentTimer = [NSTimer scheduledTimerWithTimeInterval:0.1
                                                            target:self
                                                          selector:@selector(checkPendingPresent)
                                                          userInfo:nil
                                                           repeats:YES];
    return;
  }

  [self presentAtIndex:index animated:animated completion:nil];
}

- (void)checkPendingPresent {
  UIViewController *blockingVC = _pendingPresentBlockingVC;
  if (blockingVC && blockingVC.view.window && !blockingVC.isBeingDismissed) {
    return;
  }

  NSInteger index = _pendingPresentIndex;
  BOOL animated = _pendingPresentAnimated;
  TrueSheetCompletionBlock completion = _pendingPresentCompletion;

  [self cancelPendingPresent];
  [self presentAtIndex:index animated:animated completion:completion];
}

@end

Class<RCTComponentViewProtocol> TrueSheetViewCls(void) {
  return TrueSheetView.class;
}

#endif  // RCT_NEW_ARCH_ENABLED
