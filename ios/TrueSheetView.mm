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
#import "events/OnDetentChangeEvent.h"
#import "events/OnDidDismissEvent.h"
#import "events/OnDidPresentEvent.h"
#import "events/OnDragBeginEvent.h"
#import "events/OnDragChangeEvent.h"
#import "events/OnDragEndEvent.h"
#import "events/OnMountEvent.h"
#import "events/OnPositionChangeEvent.h"
#import "events/OnSizeChangeEvent.h"
#import "events/OnWillDismissEvent.h"
#import "events/OnWillPresentEvent.h"
#import "utils/LayoutUtil.h"
#import "utils/WindowUtil.h"

#import <react/renderer/components/TrueSheetSpec/ComponentDescriptors.h>
#import <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>
#import <react/renderer/components/TrueSheetSpec/RCTComponentViewHelpers.h>

#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>
#import <React/RCTSurfaceTouchHandler.h>
#import <React/RCTUtils.h>

using namespace facebook::react;

@interface TrueSheetView () <TrueSheetViewControllerDelegate, TrueSheetContainerViewDelegate>
@end

@implementation TrueSheetView {
  TrueSheetContainerView *_containerView;
  TrueSheetViewController *_controller;
  RCTSurfaceTouchHandler *_touchHandler;
  NSInteger _initialDetentIndex;
  BOOL _initialDetentAnimated;
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const TrueSheetViewProps>();
    _props = defaultProps;

    // Initialize controller - persists across container lifecycle
    _controller = [[TrueSheetViewController alloc] init];
    _controller.delegate = self;

    // Initialize touch handler - will be attached to container when mounted
    _touchHandler = [[RCTSurfaceTouchHandler alloc] init];

    _containerView = nil;

    _initialDetentIndex = -1;
    _initialDetentAnimated = YES;
  }
  return self;
}

- (void)didMoveToWindow {
  [super didMoveToWindow];

  if (!self.window) {
    return;
  }

  // Register this view with the TurboModule when added to window
  // This ensures the tag is properly set by the framework
  if (self.tag > 0) {
    [TrueSheetModule registerView:self withTag:@(self.tag)];
  }
}

- (void)dealloc {
  // Dismiss controller if presented
  if (_controller && _controller.presentingViewController) {
    [_controller dismissViewControllerAnimated:NO completion:nil];
  }

  // Clean up controller
  _controller.delegate = nil;
  _controller = nil;

  // Unregister this view from the TurboModule
  [TrueSheetModule unregisterViewWithTag:@(self.tag)];
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<TrueSheetViewComponentDescriptor>();
}

#pragma mark - TurboModule Methods

- (void)presentAtIndex:(NSInteger)index
              animated:(BOOL)animated
            completion:(nullable TrueSheetCompletionBlock)completion {
  if (_controller.isPresented) {
    [_controller.sheetPresentationController animateChanges:^{
      [self->_controller setupActiveDetentWithIndex:index];
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

  // Setup our sheet properties
  [_controller setupSheetProps];
  [_controller setupSheetDetents];

  // Set to the given detent index
  [_controller setupActiveDetentWithIndex:index];

  // Present our sheet
  [presentingViewController presentViewController:self->_controller
                                         animated:animated
                                       completion:^{
                                         // Call completion handler
                                         if (completion) {
                                           completion(YES, nil);
                                         }
                                       }];
}

- (void)dismissAnimated:(BOOL)animated completion:(nullable TrueSheetCompletionBlock)completion {
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

- (void)resizeToIndex:(NSInteger)index {
  if (_controller.isPresented) {
    [_controller.sheetPresentationController animateChanges:^{
      [self->_controller setupActiveDetentWithIndex:index];
    }];
  }
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps {
  [super updateProps:props oldProps:oldProps];

  const auto &newProps = *std::static_pointer_cast<TrueSheetViewProps const>(props);

  // Update detents - pass numbers directly (-1 represents "auto")
  NSMutableArray *detents = [NSMutableArray new];
  for (const auto &detent : newProps.detents) {
    [detents addObject:@(detent)];
  }

  _controller.detents = detents;

  if (newProps.background == 0) {
    _controller.backgroundColor = nil;
  } else {
    UIColor *color = RCTUIColorFromSharedColor(SharedColor(newProps.background));
    _controller.backgroundColor = color;
  }

  // Update blur tint - always set it to clear when removed
  _controller.blurTint = !newProps.blurTint.empty() ? RCTNSStringFromString(newProps.blurTint) : nil;

  // Update corner radius
  if (newProps.cornerRadius < 0) {
    _controller.cornerRadius = nil;
  } else {
    _controller.cornerRadius = @(newProps.cornerRadius);
  }

  // Update max height
  if (newProps.maxHeight != 0.0) {
    _controller.maxHeight = @(newProps.maxHeight);
  }

  // Update grabber
  _controller.grabber = newProps.grabber;

  // Update dismissible
  _controller.modalInPresentation = !newProps.dismissible;

  // Update dimmed
  _controller.dimmed = newProps.dimmed;

  // Update dimmedDetentIndex
  if (newProps.dimmedDetentIndex >= 0) {
    _controller.dimmedDetentIndex = @(newProps.dimmedDetentIndex);
  }

  // Store initial presentation settings
  _initialDetentIndex = newProps.initialDetentIndex;
  _initialDetentAnimated = newProps.initialDetentAnimated;
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask {
  [super finalizeUpdates:updateMask];

  // Apply controller updates after all props and children are updated
  if (updateMask & RNComponentViewUpdateMaskProps) {
    // Apply changes to presented sheet if needed
    if (_controller.isPresented) {
      [_controller.sheetPresentationController animateChanges:^{
        [self->_controller setupSheetProps];
        [self->_controller setupSheetDetents];
        [self->_controller applyActiveDetent];
      }];
    } else {
      // Handle initial presentation
      if (_initialDetentIndex >= 0 && !_controller.isPresented) {
        [self presentAtIndex:_initialDetentIndex animated:_initialDetentAnimated completion:nil];
      }
    }
  }
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  // Check if it's a container view
  if ([childComponentView isKindOfClass:[TrueSheetContainerView class]]) {
    if (_containerView != nil) {
      NSLog(@"TrueSheet: Sheet can only have one container component.");
      return;
    }

    _containerView = (TrueSheetContainerView *)childComponentView;

    // Set this view as the container's delegate
    _containerView.delegate = self;

    // Attach touch handler to container for touch event handling
    [_touchHandler attachToView:_containerView];

    // Add to parent view hierarchy
    [_controller.view addSubview:_containerView];

    // Pin container to fill the entire parent view
    [LayoutUtil pinView:_containerView toParentView:_controller.view edges:UIRectEdgeAll];

    // Ensure container is above background view
    [_controller.view bringSubviewToFront:_containerView];

    // Get initial content height from container
    CGFloat contentHeight = [_containerView contentHeight];
    if (contentHeight > 0) {
      _controller.contentHeight = @(contentHeight);
    }

    // Emit onMount event when container is mounted
    [OnMountEvent emit:_eventEmitter];
  }
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  if ([childComponentView isKindOfClass:[TrueSheetContainerView class]]) {
    _containerView.delegate = nil;

    // Detach touch handler
    if (_touchHandler) {
      [_touchHandler detachFromView:_containerView];
    }

    // Unpin and remove from view hierarchy
    [LayoutUtil unpinView:_containerView];
    [_containerView removeFromSuperview];

    _containerView = nil;
  }
}

- (void)prepareForRecycle {
  [super prepareForRecycle];

  // Dismiss controller if presented
  if (_controller && _controller.presentingViewController) {
    [_controller dismissViewControllerAnimated:YES completion:nil];
  }

  // Unregister from the registry
  // Note: Re-registration will happen automatically when the component is reused
  [TrueSheetModule unregisterViewWithTag:@(self.tag)];
}

#pragma mark - TrueSheetContainerViewDelegate

- (void)containerViewContentDidChangeSize:(CGSize)newSize {
  // Clamp content height to container height to prevent unbounded growth with scrollable content
  CGFloat containerHeight = _controller.containerHeight;
  CGFloat contentHeight = containerHeight > 0 ? MIN(newSize.height, containerHeight) : newSize.height;

  _controller.contentHeight = @(contentHeight);

  // Update detents if sheet is already presented
  if (_controller.isPresented) {
    // Tell controller that we are transitioning from layout changes.
    // Controller viewDidLayoutSubviews will handle position notification.
    _controller.layoutTransitioning = YES;

    [_controller.sheetPresentationController animateChanges:^{
      [self->_controller setupSheetDetents];
    }];
  }
}

#pragma mark - TrueSheetViewControllerDelegate

- (void)viewControllerWillPresent {
  NSInteger index = [_controller currentDetentIndex];
  CGFloat position = _controller.currentPosition;

  _controller.activeDetentIndex = index;

  [OnWillPresentEvent emit:_eventEmitter index:index position:position];

  // Emit onChangeSize event to layout our container on JS
  CGSize controllerSize = _controller.view.frame.size;
  [OnSizeChangeEvent emit:_eventEmitter width:controllerSize.width height:controllerSize.height];
}

- (void)viewControllerDidPresent {
  NSInteger index = [_controller currentDetentIndex];
  CGFloat position = _controller.currentPosition;

  [OnDidPresentEvent emit:_eventEmitter index:index position:position];
}

- (void)viewControllerDidDrag:(UIGestureRecognizerState)state index:(NSInteger)index position:(CGFloat)position {
  switch (state) {
    case UIGestureRecognizerStateBegan:
      [OnDragBeginEvent emit:_eventEmitter index:index position:position];
      break;

    case UIGestureRecognizerStateChanged:
      [OnDragChangeEvent emit:_eventEmitter index:index position:position];
      break;

    case UIGestureRecognizerStateEnded:
    case UIGestureRecognizerStateCancelled:
      [OnDragEndEvent emit:_eventEmitter index:index position:position];
      break;

    default:
      break;
  }
}

- (void)viewControllerWillDismiss {
  [OnWillDismissEvent emit:_eventEmitter];
}

- (void)viewControllerDidDismiss {
  _controller.activeDetentIndex = -1;

  [OnDidDismissEvent emit:_eventEmitter];
}

- (void)viewControllerDidChangeDetent:(NSInteger)index position:(CGFloat)position {
  if (_controller.activeDetentIndex != index) {
    _controller.activeDetentIndex = index;
  }

  [OnDetentChangeEvent emit:_eventEmitter index:index position:position];
}

- (void)viewControllerDidChangePosition:(NSInteger)index position:(CGFloat)position transitioning:(BOOL)transitioning {
  [OnPositionChangeEvent emit:_eventEmitter index:index position:position transitioning:transitioning];
}

- (void)viewControllerDidChangeSize:(CGSize)size {
  [OnSizeChangeEvent emit:_eventEmitter width:size.width height:size.height];
}

#pragma mark - Private Helpers

- (UIViewController *)findPresentingViewController {
  UIWindow *keyWindow = [WindowUtil keyWindow];

  if (!keyWindow) {
    return nil;
  }

  UIViewController *rootViewController = keyWindow.rootViewController;

  // Find the top-most presented view controller
  while (rootViewController.presentedViewController) {
    UIViewController *presented = rootViewController.presentedViewController;

    // Skip TrueSheetViewController if it's being dismissed
    if ([presented isKindOfClass:[TrueSheetViewController class]] && presented.isBeingDismissed) {
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
