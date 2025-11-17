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

@interface TrueSheetView () <TrueSheetViewControllerDelegate, TrueSheetContainerViewDelegate>
@end

@implementation TrueSheetView {
  TrueSheetViewController *_controller;
  TrueSheetContainerView *_containerView;
  TrueSheetFooterView *_footerView;

  BOOL _isPresented;
  NSNumber *_activeIndex;

  LayoutMetrics _layoutMetrics;
}

@synthesize controller = _controller;

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const TrueSheetViewProps>();
    _props = defaultProps;

    _controller = [[TrueSheetViewController alloc] init];
    _controller.delegate = self;
    _isPresented = NO;
    _activeIndex = nil;
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

  if (_containerView != nil) {
    // Measure container's content height for "auto" detent sizing
    CGFloat contentHeight = _containerView.frame.size.height;
    if (contentHeight > 0) {
      _controller.contentHeight = @(contentHeight);
    }

    // Handle initial presentation - present if not already presented and initialIndex is valid
    const auto &props = *std::static_pointer_cast<TrueSheetViewProps const>(_props);
    if (props.initialIndex >= 0 && !_isPresented) {
      BOOL animated = props.initialIndexAnimated;
      [self presentAtIndex:props.initialIndex animated:animated completion:nil];
    }
  }
}

- (void)dealloc {
  // Dismiss the sheet if it's currently being presented (with animation for better UX)
  if (_controller) {
    [_controller dismissViewControllerAnimated:YES completion:nil];
  }

  // Clean up controller
  _controller.delegate = nil;
  _controller = nil;

  _isPresented = NO;
  _activeIndex = nil;

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
  if (_isPresented) {
    [_controller.sheetPresentationController animateChanges:^{
      [_controller resizeToIndex:index];
    }];

    if (completion) {
      completion(YES, nil);
    }
    return;
  }

  UIViewController *rootViewController = [self findPresentingViewController];

  if (!rootViewController) {
    NSError *error = [NSError errorWithDomain:@"com.lodev09.TrueSheet"
                                         code:1001
                                     userInfo:@{NSLocalizedDescriptionKey : @"No root view controller found"}];

    if (completion) {
      completion(NO, error);
    }
    return;
  }

  _isPresented = YES;
  _activeIndex = @(index);

  // Apply initial props before presenting
  const auto &props = *std::static_pointer_cast<TrueSheetViewProps const>(_props);

  // Set background color
  if (props.background != 0) {
    UIColor *color = RCTUIColorFromSharedColor(SharedColor(props.background));
    _controller.backgroundColor = color;
  }

  // Set blur tint
  if (!props.blurTint.empty()) {
    _controller.blurTint = RCTNSStringFromString(props.blurTint);
  }

  // Prepare the sheet with the correct initial index before presenting
  [_controller
    prepareForPresentationAtIndex:index
                       completion:^{
                         [rootViewController
                           presentViewController:self->_controller
                                        animated:animated
                                      completion:^{
                                        // Emit onDidPresent event after presenting
                                        NSDictionary *detentInfo = self->_controller.currentDetentInfo;
                                        CGFloat detentValue = detentInfo ? [detentInfo[@"value"] doubleValue] : 0.0;
                                        CGFloat position = self->_controller.position;

                                        [OnDidPresentEvent emit:self->_eventEmitter
                                                          index:index
                                                          value:detentValue
                                                       position:position];

                                        // Call completion handler
                                        if (completion) {
                                          completion(YES, nil);
                                        }
                                      }];
                       }];
}

- (void)dismissAnimated:(BOOL)animated completion:(nullable TrueSheetCompletionBlock)completion {
  if (!_isPresented) {
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

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps {
  const auto &oldViewProps = *std::static_pointer_cast<TrueSheetViewProps const>(_props);
  const auto &newViewProps = *std::static_pointer_cast<TrueSheetViewProps const>(props);

  BOOL needsSetupDetents = NO;
  BOOL needsSetupDimmed = NO;

  // Update detents
  if (oldViewProps.detents != newViewProps.detents) {
    NSMutableArray *detents = [NSMutableArray new];
    for (const auto &detent : newViewProps.detents) {
      [detents addObject:RCTNSStringFromString(detent)];
    }
    _controller.detents = detents;
    needsSetupDetents = YES;
    needsSetupDimmed = YES;
  }

  // Update background color
  if (oldViewProps.background != newViewProps.background) {
    if (newViewProps.background != 0) {
      UIColor *color = RCTUIColorFromSharedColor(SharedColor(newViewProps.background));
      _controller.backgroundColor = color;
      [_controller setupBackground];
    }
  }

  // Update blur tint
  if (oldViewProps.blurTint != newViewProps.blurTint) {
    // Set to nil if empty, otherwise convert string
    _controller.blurTint = !newViewProps.blurTint.empty() ? RCTNSStringFromString(newViewProps.blurTint) : nil;
  }

  // Update corner radius
  if (oldViewProps.cornerRadius != newViewProps.cornerRadius) {
    // -1 = use system default (nil), 0 = sharp corners, >0 = custom value
    if (newViewProps.cornerRadius < 0) {
      _controller.cornerRadius = nil;
    } else {
      _controller.cornerRadius = @(newViewProps.cornerRadius);
    }
  }

  // Update max height
  if (oldViewProps.maxHeight != newViewProps.maxHeight) {
    if (newViewProps.maxHeight != 0.0) {
      _controller.maxHeight = @(newViewProps.maxHeight);
    }
  }

  // Update grabber
  if (oldViewProps.grabber != newViewProps.grabber) {
    _controller.grabber = newViewProps.grabber;
  }

  // Update dismissible
  if (oldViewProps.dismissible != newViewProps.dismissible) {
    _controller.modalInPresentation = !newViewProps.dismissible;
  }

  // Update dimmed
  if (oldViewProps.dimmed != newViewProps.dimmed) {
    _controller.dimmed = newViewProps.dimmed;
    needsSetupDimmed = YES;
  }

  // Update dimmedIndex
  if (oldViewProps.dimmedIndex != newViewProps.dimmedIndex) {
    if (newViewProps.dimmedIndex >= 0) {
      _controller.dimmedIndex = @(newViewProps.dimmedIndex);
    }
    needsSetupDimmed = YES;
  }

  [super updateProps:props oldProps:oldProps];

  // Apply changes to presented sheet if needed
  if (_isPresented) {
    [_controller.sheetPresentationController animateChanges:^{
      if (needsSetupDetents) {
        [_controller setupDetents];
        [_controller resizeToIndex:[_activeIndex integerValue]];
      }

      if (needsSetupDimmed)
        [_controller setupDimmedBackground];
    }];
  }
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask {
  [super finalizeUpdates:updateMask];

  // Apply batched updates to the view hierarchy
  if (updateMask & RNComponentViewUpdateMaskProps) {
    // Trigger layout update after prop changes
    [_controller.view setNeedsLayout];
  }
}

- (void)updateLayoutMetrics:(const facebook::react::LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const facebook::react::LayoutMetrics &)oldLayoutMetrics {
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  // Store layout metrics for later use
  _layoutMetrics = layoutMetrics;
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  // Check if it's a container or footer view
  if ([childComponentView isKindOfClass:[TrueSheetContainerView class]]) {
    if (_containerView != nil) {
      NSLog(@"TrueSheet: Sheet can only have one container component.");
      return;
    }

    _containerView = (TrueSheetContainerView *)childComponentView;

    // Set delegate to listen for size changes
    _containerView.delegate = self;

    // Setup container in sheet view (handles reference and touch handling)
    [_containerView setupInSheetView:self];
  }

  if ([childComponentView isKindOfClass:[TrueSheetFooterView class]]) {
    if (_footerView != nil) {
      NSLog(@"TrueSheet: Sheet can only have one footer component.");
      return;
    }

    _footerView = (TrueSheetFooterView *)childComponentView;

    // Setup footer in sheet view (handles reference and touch handling)
    [_footerView setupInSheetView:self];
  }
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  if ([childComponentView isKindOfClass:[TrueSheetContainerView class]]) {
    [_containerView cleanup];
    _containerView = nil;
  }

  if ([childComponentView isKindOfClass:[TrueSheetFooterView class]]) {
    [_footerView cleanup];
    _footerView = nil;
  }
}

- (void)prepareForRecycle {
  [super prepareForRecycle];
  [self invalidate];

  // Unregister from the registry
  // Note: Re-registration will happen automatically when the component is reused
  [TrueSheetModule unregisterViewWithTag:@(self.tag)];
}

#pragma mark - TrueSheetViewControllerDelegate

- (void)viewControllerWillAppear {
  [OnWillPresentEvent emit:_eventEmitter];
}

- (void)viewControllerDidDrag:(UIGestureRecognizerState)state height:(CGFloat)height position:(CGFloat)position {
  NSInteger index = _activeIndex ? [_activeIndex integerValue] : 0;

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

- (void)viewControllerDidDismiss {
  _isPresented = NO;
  _activeIndex = nil;

  [OnDismissEvent emit:_eventEmitter];
}

- (void)viewControllerDidChangeDetent:(NSInteger)index value:(CGFloat)value position:(CGFloat)position {
  if (!_activeIndex || [_activeIndex integerValue] != index) {
    _activeIndex = @(index);

    [OnDetentChangeEvent emit:_eventEmitter index:index value:value position:position];
  }
}

- (void)viewControllerDidChangePosition:(CGFloat)height position:(CGFloat)position {
  NSInteger index = _activeIndex ? [_activeIndex integerValue] : 0;

  [OnPositionChangeEvent emit:_eventEmitter index:index value:height position:position];
}

#pragma mark - TrueSheetContainerViewDelegate

- (void)containerViewDidChangeSize:(CGSize)newSize {
  // Update content height when container size changes
  _controller.contentHeight = @(newSize.height);

  // If sheet is already presented, update its detents and resize
  if (_isPresented) {
    [_controller.sheetPresentationController animateChanges:^{
      [_controller setupDetents];
    }];
  }
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
