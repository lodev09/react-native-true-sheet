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
#import "events/OnMountEvent.h"
#import "events/OnWillPresentEvent.h"
#import "events/OnDidPresentEvent.h"
#import "events/OnDismissEvent.h"
#import "events/OnDetentChangeEvent.h"
#import "events/OnDragBeginEvent.h"
#import "events/OnDragChangeEvent.h"
#import "events/OnDragEndEvent.h"
#import "events/OnPositionChangeEvent.h"
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

@interface TrueSheetView ()
@end

@implementation TrueSheetView {
  TrueSheetContainerView *_containerView;
  LayoutMetrics _layoutMetrics;
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const TrueSheetViewProps>();
    _props = defaultProps;

    _containerView = nil;
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

  // Emit onMount event once
  [OnMountEvent emit:_eventEmitter];
}

- (void)handleInitialPresentation {
  // Handle initial presentation after container is mounted and view is in window
  if (!_containerView) {
    return;
  }
  
  if (!self.window) {
    // Defer until view is in window
    dispatch_async(dispatch_get_main_queue(), ^{
      [self handleInitialPresentation];
    });
    return;
  }
  
  const auto &props = *std::static_pointer_cast<TrueSheetViewProps const>(_props);
  
  if (props.initialIndex >= 0) {
    BOOL animated = props.initialIndexAnimated;
    UIViewController *presentingViewController = [self findPresentingViewController];
    [_containerView presentAtIndex:props.initialIndex 
                          animated:animated 
          presentingViewController:presentingViewController
                        completion:nil];
  }
}

- (void)dealloc {
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
  if (!_containerView) {
    NSError *error = [NSError errorWithDomain:@"com.lodev09.TrueSheet"
                                         code:1002
                                     userInfo:@{NSLocalizedDescriptionKey : @"Container view not mounted"}];
    if (completion) {
      completion(NO, error);
    }
    return;
  }

  UIViewController *presentingViewController = [self findPresentingViewController];
  [_containerView presentAtIndex:index 
                        animated:animated 
        presentingViewController:presentingViewController
                      completion:completion];
}

- (void)dismissAnimated:(BOOL)animated completion:(nullable TrueSheetCompletionBlock)completion {
  if (!_containerView) {
    if (completion) {
      completion(YES, nil);
    }
    return;
  }

  [_containerView dismissAnimated:animated completion:completion];
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps {
  [super updateProps:props oldProps:oldProps];
  
  // Notify container to apply updated props
  if (_containerView) {
    [_containerView applyPropsFromSheetView];
  }
}

- (void)updateLayoutMetrics:(const facebook::react::LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const facebook::react::LayoutMetrics &)oldLayoutMetrics {
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  // Store layout metrics for later use
  _layoutMetrics = layoutMetrics;
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  // Check if it's a container view
  if ([childComponentView isKindOfClass:[TrueSheetContainerView class]]) {
    if (_containerView != nil) {
      NSLog(@"TrueSheet: Sheet can only have one container component.");
      return;
    }

    _containerView = (TrueSheetContainerView *)childComponentView;

    // Setup container in sheet view (handles reference and touch handling)
    [_containerView setupInSheetView:self];
    
    // Trigger initial presentation now that container is ready
    [self handleInitialPresentation];
  }
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  if ([childComponentView isKindOfClass:[TrueSheetContainerView class]]) {
    [_containerView cleanup];
    _containerView = nil;
  }
}

- (void)prepareForRecycle {
  [super prepareForRecycle];
  [self invalidate];

  // Unregister from the registry
  // Note: Re-registration will happen automatically when the component is reused
  [TrueSheetModule unregisterViewWithTag:@(self.tag)];
}

#pragma mark - Event Notification Methods (called by container)

- (void)notifyWillPresent {
  if (!_containerView) return;
  
  NSDictionary *detentInfo = _containerView.controller.currentDetentInfo;
  CGFloat position = _containerView.controller.currentPosition;
  
  [OnWillPresentEvent emit:_eventEmitter
                    index:[detentInfo[@"index"] intValue]
                    value:[detentInfo[@"value"] doubleValue]
                 position:position];
}

- (void)notifyDidPresent {
  if (!_containerView) return;
  
  NSDictionary *detentInfo = _containerView.controller.currentDetentInfo;
  CGFloat position = _containerView.controller.currentPosition;

  [OnDidPresentEvent emit:_eventEmitter
                    index:[detentInfo[@"index"] intValue]
                    value:[detentInfo[@"value"] doubleValue]
                 position:position];
}

- (void)notifyDidDrag:(UIGestureRecognizerState)state 
                index:(NSInteger)index 
               height:(CGFloat)height 
             position:(CGFloat)position {
  switch (state) {
    case UIGestureRecognizerStateBegan:
      [OnDragBeginEvent emit:_eventEmitter index:index value:height position:position];
      break;

    case UIGestureRecognizerStateChanged:
      [OnDragChangeEvent emit:_eventEmitter index:index value:height position:position];
      break;

    case UIGestureRecognizerStateEnded:
    case UIGestureRecognizerStateCancelled:
      [OnDragEndEvent emit:_eventEmitter index:index value:height position:position];
      break;

    default:
      break;
  }
}

- (void)notifyDidDismiss {
  [OnDismissEvent emit:_eventEmitter];
}

- (void)notifyDidChangeDetent:(NSInteger)index value:(CGFloat)value position:(CGFloat)position {
  [OnDetentChangeEvent emit:_eventEmitter index:index value:value position:position];
}

- (void)notifyDidChangePosition:(NSInteger)index height:(CGFloat)height position:(CGFloat)position {
  [OnPositionChangeEvent emit:_eventEmitter index:index value:height position:position];
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
