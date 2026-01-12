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
#import <react/renderer/core/EventDispatcher.h>
#import <react/renderer/core/EventTarget.h>
#import <react/renderer/core/State.h>

using namespace facebook::react;

@interface TrueSheetView () <TrueSheetViewControllerDelegate, TrueSheetContainerViewDelegate>
@end

@implementation TrueSheetView {
  TrueSheetContainerView *_containerView;
  TrueSheetViewController *_controller;
  RCTSurfaceTouchHandler *_touchHandler;
  TrueSheetViewShadowNode::ConcreteState::Shared _state;
  UIView *_snapshotView;
  CGSize _lastStateSize;
  NSInteger _initialDetentIndex;
  BOOL _scrollable;
  BOOL _initialDetentAnimated;
  BOOL _isSheetUpdatePending;
  BOOL _pendingLayoutUpdate;
  BOOL _didInitiallyPresent;
  std::shared_ptr<const EventDispatcher> _eventDispatcher;
  std::shared_ptr<const EventListener> _eventListener;
  NSInteger _presenterScreenTag;
  __weak UIViewController *_presenterScreenController;
  NSInteger _parentModalTag;
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

  if (_initialDetentIndex >= 0 && !_didInitiallyPresent) {
    UIViewController *vc = [self findPresentingViewController];

    // Only present if the view controller is in the same window and not being dismissed
    if (vc && vc.view.window == self.window && !vc.isBeingDismissed) {
      _didInitiallyPresent = YES;
      [self presentAtIndex:_initialDetentIndex animated:_initialDetentAnimated completion:nil];
    } else {
      // Animate next time when sheet finally moves to the correct window
      _initialDetentAnimated = YES;
    }
  }
}

- (void)dealloc {
  if (_eventDispatcher && _eventListener) {
    _eventDispatcher->removeListener(_eventListener);
  }
  _eventListener = nullptr;
  _eventDispatcher = nullptr;

  if (_controller && _controller.presentingViewController) {
    // Find the root presenting controller to dismiss the entire stack
    UIViewController *root = _controller.presentingViewController;
    while (root.presentingViewController != nil) {
      root = root.presentingViewController;
    }
    [root dismissViewControllerAnimated:YES completion:nil];
  }

  _didInitiallyPresent = NO;

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
  _controller.backgroundBlur = !newProps.backgroundBlur.empty() ? RCTNSStringFromString(newProps.backgroundBlur) : nil;

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

  _controller.insetAdjustment = RCTNSStringFromString(toString(newProps.insetAdjustment));

  if (_containerView) {
    _containerView.scrollViewPinningEnabled = _scrollable;
  }
}

- (void)updateState:(const State::Shared &)state oldState:(const State::Shared &)oldState {
  _state = std::static_pointer_cast<TrueSheetViewShadowNode::ConcreteState const>(state);

  if (_controller) {
    [self updateStateWithSize:_controller.view.frame.size];
  }

  // Setup event listener for screen lifecycle events (onWillDisappear)
  if (!_eventDispatcher) {
    if (auto dispatcherPtr = _state.get()->getData().getEventDispatcher().lock()) {
      _eventDispatcher = dispatcherPtr;

      __weak TrueSheetView *weakSelf = self;
      
      _eventListener = std::make_shared<const EventListener>([weakSelf](const RawEvent &event) {
        TrueSheetView *strongSelf = weakSelf;
        if (!strongSelf) {
          return false;
        }
        
        if (event.type == "topWillDisappear") {
          NSInteger presenterScreenTag = strongSelf->_presenterScreenTag;
          if (!strongSelf->_controller.isPresented ||
              strongSelf->_controller.isBeingDismissed ||
              presenterScreenTag == 0) {
            return false;
          }

          if (auto family = event.shadowNodeFamily.lock()) {
            Tag screenTag = family->getTag();

            if (presenterScreenTag == screenTag) {
              // If inside a modal, check if this is a nav pop vs modal dismiss
              NSInteger parentModalTag = strongSelf->_parentModalTag;
              if (parentModalTag != 0) {
                UIViewController *screenController = strongSelf->_presenterScreenController;
                UINavigationController *navController = screenController.navigationController;
                
                // If screen is still in nav stack, it's a modal dismiss - skip
                // (the modal dismissal will handle the sheet)
                if (navController && [navController.viewControllers containsObject:screenController]) {
                  return false;
                }
              }
              
              [strongSelf dismissAllAnimated:YES completion:nil];
            }
          }
        }
        return false;
      });

      _eventDispatcher->addListener(_eventListener);
    }
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
    BOOL pendingLayoutUpdate = _pendingLayoutUpdate;
    _pendingLayoutUpdate = NO;

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
}

#pragma mark - Child Component Mounting

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  if (![childComponentView isKindOfClass:[TrueSheetContainerView class]])
    return;

  if (_containerView != nil) {
    RCTLogWarn(@"TrueSheet: Sheet can only have one container component.");
    return;
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

  _containerView.scrollViewPinningEnabled = _scrollable;
  [_containerView setupContentScrollViewPinning];

  [TrueSheetLifecycleEvents emitMount:_eventEmitter];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  if (![childComponentView isKindOfClass:[TrueSheetContainerView class]])
    return;

  UIView *superView = _containerView.superview;
  UIView *snapshot = [_containerView snapshotViewAfterScreenUpdates:NO];
  if (snapshot) {
    snapshot.frame = _containerView.frame;
    [superView insertSubview:snapshot belowSubview:_containerView];
    _snapshotView = snapshot;
  }

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

  [_controller setupSheetProps];
  [_controller setupSheetDetents];
  [_controller setupActiveDetentWithIndex:index];

  // Capture presenter screen info for screen unmount detection
  _presenterScreenTag = 0;
  _presenterScreenController = nil;
  _parentModalTag = 0;
  UIView *view = self.superview;
  while (view) {
    NSString *className = NSStringFromClass([view class]);
    if (_presenterScreenTag == 0 && [className isEqualToString:@"RNSScreenView"]) {
      _presenterScreenTag = view.tag;
      // Get the screen's controller via responder chain
      for (UIResponder *responder = view; responder; responder = responder.nextResponder) {
        if ([responder isKindOfClass:[UIViewController class]]) {
          _presenterScreenController = (UIViewController *)responder;
          break;
        }
      }
    } else if ([className isEqualToString:@"RNSModalScreen"]) {
      _parentModalTag = view.tag;
      break;
    }
    view = view.superview;
  }

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

- (void)resizeToIndex:(NSInteger)index completion:(nullable TrueSheetCompletionBlock)completion {
  if (!_controller.isPresented) {
    RCTLogWarn(@"TrueSheet: Cannot resize. Sheet is not presented.");
    if (completion) {
      completion(YES, nil);
    }
    return;
  }

  [self presentAtIndex:index animated:YES completion:completion];
}

- (TrueSheetViewController *)viewController {
  return _controller;
}

- (void)dismissAllAnimated:(BOOL)animated completion:(nullable TrueSheetCompletionBlock)completion {
  if (!_controller.isPresented) {
    if (completion) {
      completion(YES, nil);
    }
    return;
  }

  [self viewControllerDidChangePosition:-1 position:_controller.screenHeight detent:0 realtime:NO];

  // Dismiss from the presenting view controller to dismiss this sheet and all its children
  UIViewController *presenter = _controller.presentingViewController;
  [presenter dismissViewControllerAnimated:animated
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
  if (!_controller.isPresented || _isSheetUpdatePending)
    return;

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
  [_containerView setupKeyboardHandler];
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
  [_containerView cleanupKeyboardHandler];
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

- (void)viewControllerDidDetectScreenDisappear {
  [self dismissAllAnimated:YES completion:nil];
}

// See docs/SCREEN_UNMOUNT_DETECTION.md for research on detecting screen unmount

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
