//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "TrueSheetViewController.h"
#import "utils/ConversionUtil.h"
#import "utils/WindowUtil.h"

#import <React/RCTLog.h>
#import <React/RCTScrollViewComponentView.h>
#import "TrueSheetContentView.h"
#import "utils/GestureUtil.h"

@interface TrueSheetViewController ()

@end

@implementation TrueSheetViewController {
  CGFloat _lastPosition;
  CGFloat _lastTransitionPosition;
  BOOL _isTransitioning;
  BOOL _isDragging;
  BOOL _isTrackingPositionFromLayout;
  UIView *_fakeTransitionView;
  CADisplayLink *_displayLink;
}

- (instancetype)init {
  if (self = [super initWithNibName:nil bundle:nil]) {
    _detents = @[ @0.5, @1 ];
    _contentHeight = @(0);
    _grabber = YES;
    _dimmed = YES;
    _dimmedDetentIndex = @(0);
    _pageSizing = YES;
    _lastPosition = 0;
    _lastTransitionPosition = 0;
    _isTransitioning = NO;
    _isDragging = NO;
    _isTrackingPositionFromLayout = NO;
    _layoutTransitioning = NO;
    _isPresented = NO;
    _activeDetentIndex = -1;

    // Initialize fake transition view for tracking position during animations
    _fakeTransitionView = [[UIView alloc] init];
    _fakeTransitionView.hidden = YES;
    _fakeTransitionView.userInteractionEnabled = NO;
  }
  return self;
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];

  // Ensure display link is invalidated to prevent retain cycle
  if (_displayLink) {
    [_displayLink invalidate];
    _displayLink = nil;
  }
}

#pragma mark - Presentation State

- (BOOL)isTopmostPresentedController {
  // Check if we're in the window hierarchy and visible
  if (!self.isViewLoaded || self.view.window == nil) {
    return NO;
  }

  // Check if another controller is presented on top of this sheet
  return self.presentedViewController == nil;
}

- (BOOL)isActiveAndVisible {
  return self.isViewLoaded && self.view.window != nil && !self.isBeingDismissed;
}

- (UIView *)presentedView {
  return self.sheetPresentationController.presentedView;
}

- (void)viewDidLoad {
  [super viewDidLoad];

  self.view.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
}

- (void)viewWillAppear:(BOOL)animated {
  [super viewWillAppear:animated];

  // Only trigger willPresent on the initial presentation, not on repositioning
  if (!_isPresented) {
    if ([self.delegate respondsToSelector:@selector(viewControllerWillPresent)]) {
      [self.delegate viewControllerWillPresent];
    }

    // Setup transition position tracking
    [self setupTransitionPositionTracking];
  }
}

- (void)viewDidAppear:(BOOL)animated {
  [super viewDidAppear:animated];

  // Only trigger didPresent on the initial presentation, not on repositioning
  if (!_isPresented) {
    if ([self.delegate respondsToSelector:@selector(viewControllerDidPresent)]) {
      [self.delegate viewControllerDidPresent];
    }

    // Setup gesture recognizer after view appears and React content is mounted
    [self setupGestureRecognizer];

    _isPresented = YES;
  }
}

- (void)viewWillDisappear:(BOOL)animated {
  [super viewWillDisappear:animated];

  // Only dispatch willDismiss if the sheet is actually being dismissed
  if (self.isBeingDismissed && [self.delegate respondsToSelector:@selector(viewControllerWillDismiss)]) {
    [self.delegate viewControllerWillDismiss];
  }

  [self setupTransitionPositionTracking];
  _isTrackingPositionFromLayout = NO;
}

- (void)viewDidDisappear:(BOOL)animated {
  [super viewDidDisappear:animated];

  // Only dispatch didDismiss if the sheet is actually being dismissed
  // (not when another modal is presented on top)
  BOOL isActuallyDismissing = self.presentingViewController == nil || self.isBeingDismissed;

  if (isActuallyDismissing && [self.delegate respondsToSelector:@selector(viewControllerDidDismiss)]) {
    [self.delegate viewControllerDidDismiss];
  }

  _isTrackingPositionFromLayout = NO;

  // Only reset state if actually dismissing
  if (isActuallyDismissing) {
    _isPresented = NO;
    _activeDetentIndex = -1;
  }
}

- (void)viewWillTransitionToSize:(CGSize)size
       withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator {
  [super viewWillTransitionToSize:size withTransitionCoordinator:coordinator];

  // Handle rotation/size change
  [coordinator
    animateAlongsideTransition:^(id<UIViewControllerTransitionCoordinatorContext> context) {
      // Animation block - updates happen here
    }
    completion:^(id<UIViewControllerTransitionCoordinatorContext> context) {
      // After rotation completes
      [self setupSheetDetents];

      // Notify delegate of size change for state update
      if ([self.delegate respondsToSelector:@selector(viewControllerDidChangeSize:)]) {
        [self.delegate viewControllerDidChangeSize:size];
      }
    }];
}

- (void)viewDidLayoutSubviews {
  [super viewDidLayoutSubviews];

  if (!_isTransitioning && self.isActiveAndVisible) {
    // Flag that we are tracking position from layout
    _isTrackingPositionFromLayout = YES;

    // If another controller is presented on top, treat position changes as transitioning
    // This prevents incorrect position notifications when overlays adjust our size
    [self emitChangePositionDelegateWithPosition:self.currentPosition
                                   transitioning:_layoutTransitioning || !self.isTopmostPresentedController];

    // On IOS 26, this is called twice when we have a ScrollView
    // Schedule flag reset after animation to avoid race condition
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.4 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
      // Reset layout transitioning after sending notification
      self->_layoutTransitioning = NO;
    });
  }
}

#pragma mark - Gesture Handling

/**
 * Finds the TrueSheetContentView in the hierarchy.
 *
 * @param view The presentedView to start searching from
 * @return The TrueSheetContentView found, or nil
 */
- (TrueSheetContentView *)findContentView:(UIView *)view {
  // Check if this view itself is TrueSheetContentView
  if ([view isKindOfClass:[TrueSheetContentView class]]) {
    return (TrueSheetContentView *)view;
  }

  // Recursively search all subviews
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

  // Attach to presented view's pan gestures (sheet's own drag gesture from UIKit)
  [GestureUtil attachPanGestureHandler:presentedView target:self selector:@selector(handlePanGesture:)];

  // Find and attach to the first ScrollView's pan gesture in the view hierarchy
  // This handles cases where the sheet content includes a ScrollView
  TrueSheetContentView *contentView = [self findContentView:presentedView];
  if (contentView) {
    RCTScrollViewComponentView *scrollViewComponent = [contentView findScrollView];
    if (scrollViewComponent) {
      // Access the internal UIScrollView via the scrollView property
      UIScrollView *scrollView = scrollViewComponent.scrollView;
      if (scrollView) {
        [GestureUtil attachPanGestureHandler:scrollView target:self selector:@selector(handlePanGesture:)];
      }
    }
  }
}

- (void)handlePanGesture:(UIPanGestureRecognizer *)gesture {
  NSInteger index = [self currentDetentIndex];

  if ([self.delegate respondsToSelector:@selector(viewControllerDidDrag:index:position:)]) {
    [self.delegate viewControllerDidDrag:gesture.state index:index position:self.currentPosition];
  }

  switch (gesture.state) {
    case UIGestureRecognizerStateBegan:
      _isDragging = YES;
      break;
    case UIGestureRecognizerStateChanged:
      if (!_isTrackingPositionFromLayout)
        [self emitChangePositionDelegateWithPosition:self.currentPosition transitioning:NO];
      break;
    case UIGestureRecognizerStateEnded:
    case UIGestureRecognizerStateCancelled:
      _isDragging = NO;
      break;

    default:
      break;
  }
}

#pragma mark - Position Tracking

/**
 * Emits position change to the delegate if the position has changed.
 * @param transitioning Whether the position change is part of a transition animation
 */
- (void)emitChangePositionDelegateWithPosition:(CGFloat)position transitioning:(BOOL)transitioning {
  if (_lastPosition != position) {
    _lastPosition = position;

    // Emit position change delegate
    NSInteger index = [self currentDetentIndex];

    if ([self.delegate respondsToSelector:@selector(viewControllerDidChangePosition:position:transitioning:)]) {
      [self.delegate viewControllerDidChangePosition:index position:position transitioning:transitioning];
    }
  }
}

/**
 * Sets up position tracking during view controller transitions using a fake view.
 *
 * This approach uses a hidden "fake" view added to the container that animates
 * alongside the actual presented view. By observing the presentation layer of this
 * fake view's frame, we can track smooth position changes during the native transition
 * animation without manually animating in JavaScript.
 *
 * The display link fires at screen refresh rate, allowing us to emit position updates
 * that match the native animation curve, providing smooth synchronized updates to JS.
 */
- (void)setupTransitionPositionTracking {
  if (self.transitionCoordinator != nil) {
    _isTransitioning = YES;

    // Get the container view to add our fake transition view
    UIView *containerView = self.sheetPresentationController.containerView;
    UIView *presentedView = self.presentedView;

    if (!containerView || !presentedView)
      return;

    CGRect frame = presentedView.frame;

    // Determine if presenting or dismissing to set correct start position
    BOOL isPresenting = self.isBeingPresented;

    // Set initial position based on transition type:
    // - Presenting: Start from bottom (containerHeight) and animate up to detent
    // - Dismissing: Start from current position and animate down to bottom
    if (isPresenting) {
      frame.origin.y = self.containerHeight;
    } else {
      frame.origin.y = presentedView.frame.origin.y;
    }

    // Set fake view's initial frame before transition starts
    _fakeTransitionView.frame = frame;

    auto animation = ^(id<UIViewControllerTransitionCoordinatorContext> _Nonnull context) {
      // Add fake view to container so it participates in the transition
      [[context containerView] addSubview:self->_fakeTransitionView];

      // Animate fake view to the presented view's target position
      // UIKit will animate this with the same timing curve as the sheet
      CGRect finalFrame = presentedView.frame;
      finalFrame.origin.y = presentedView.frame.origin.y;
      self->_fakeTransitionView.frame = finalFrame;

      // Set our last transition position so we can check if
      // fake view's presentation layer has changed
      // This value will not change if the sheet is being repositioned
      // during a transition after a drag
      self->_lastTransitionPosition = finalFrame.origin.y;

      // Start display link to track position changes at screen refresh rate
      // This fires at 60-120Hz and reads from the presentation layer
      self->_displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(trackTransitionPosition:)];
      [self->_displayLink addToRunLoop:[NSRunLoop currentRunLoop] forMode:NSRunLoopCommonModes];
    };

    [self.transitionCoordinator
      animateAlongsideTransition:animation
                      completion:^(id<UIViewControllerTransitionCoordinatorContext> _Nonnull context) {
                        // Clean up display link
                        [self->_displayLink invalidate];
                        self->_displayLink = nil;

                        // Remove fake view from hierarchy
                        [self->_fakeTransitionView removeFromSuperview];
                        self->_isTransitioning = NO;
                      }];
  }
}

- (void)trackTransitionPosition:(CADisplayLink *)displayLink {
  UIView *presentedView = self.presentedView;

  if (_isDragging || !_fakeTransitionView || !presentedView) {
    return;
  }

  // Get the presentation layer which contains the in-flight animated values
  // Unlike the model layer (which has the final/target value), the presentation
  // layer reflects the current state during animation
  CALayer *presentationLayer = _fakeTransitionView.layer.presentationLayer;

  if (presentationLayer) {
    BOOL transitioning = NO;
    CGFloat position = presentationLayer.frame.origin.y;

    // Our last transition position is nearly the same as fake view's layer position
    // Sheet must've been repositioning after dragging at lowest detent
    // Use 0.5 points as epsilon to account for floating-point precision in layout calculations
    if (fabs(_lastTransitionPosition - position) < 0.5) {
      // Let's just flag it as transitioning to let JS manually animate
      transitioning = YES;

      // Use the target presented view's frame position to animate
      position = presentedView.frame.origin.y;
    } else {
      // We are actually getting changes to our fake view's layer position
      // Just update our last transition position
      _lastTransitionPosition = position;
    }

    // Emit the current animated Y position to JS
    // This provides smooth position updates that match the native animation curve
    [self emitChangePositionDelegateWithPosition:position transitioning:transitioning];
  }
}

#pragma mark - Sheet Configuration (iOS 15+)

- (void)setupSheetDetents {
  UISheetPresentationController *sheet = self.sheetPresentationController;
  if (!sheet)
    return;

  NSMutableArray<UISheetPresentationControllerDetent *> *detents = [NSMutableArray array];

  // Subtract bottomInset from content height to account for safe area
  // This prevents iOS from adding extra bottom insets automatically
  CGFloat totalHeight = [self.contentHeight floatValue] - self.bottomInset;

  for (NSInteger index = 0; index < self.detents.count; index++) {
    id detent = self.detents[index];
    UISheetPresentationControllerDetent *sheetDetent = [self detentForValue:detent
                                                                 withHeight:totalHeight
                                                                    atIndex:index];
    [detents addObject:sheetDetent];
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

- (UISheetPresentationControllerDetent *)detentForValue:(id)detent withHeight:(CGFloat)height atIndex:(NSInteger)index {
  if (![detent isKindOfClass:[NSNumber class]]) {
    return [UISheetPresentationControllerDetent mediumDetent];
  }

  CGFloat value = [detent floatValue];

  // -1 represents "auto"
  if (value == -1) {
    if (@available(iOS 16.0, *)) {
      NSString *detentId = @"custom-auto";
      return [UISheetPresentationControllerDetent
        customDetentWithIdentifier:detentId
                          resolver:^CGFloat(id<UISheetPresentationControllerDetentResolutionContext> context) {
                            CGFloat maxDetentValue = context.maximumDetentValue;
                            CGFloat maxValue =
                              self.maxHeight ? fmin(maxDetentValue, [self.maxHeight floatValue]) : maxDetentValue;
                            CGFloat resolvedValue = fmin(height, maxValue);
                            return resolvedValue;
                          }];
    } else {
      return [UISheetPresentationControllerDetent mediumDetent];
    }
  }

  // Handle fraction (0-1)
  // Fraction should only be > 0 and <= 1
  if (value <= 0 || value > 1) {
    RCTLogError(@"TrueSheet: detent fraction (%f) must be between 0 and 1", value);
    return [UISheetPresentationControllerDetent mediumDetent];
  }

  NSString *detentId = [NSString stringWithFormat:@"custom-%f", value];

  if (@available(iOS 16.0, *)) {
    // Use exact comparison for common values
    if (value == 1.0) {
      return [UISheetPresentationControllerDetent largeDetent];
    } else if (value == 0.5) {
      return [UISheetPresentationControllerDetent mediumDetent];
    } else {
      return [UISheetPresentationControllerDetent
        customDetentWithIdentifier:detentId
                          resolver:^CGFloat(id<UISheetPresentationControllerDetentResolutionContext> context) {
                            CGFloat maxDetentValue = context.maximumDetentValue;
                            CGFloat maxValue =
                              self.maxHeight ? fmin(maxDetentValue, [self.maxHeight floatValue]) : maxDetentValue;
                            CGFloat resolvedValue = fmin(value * maxDetentValue, maxValue);
                            return resolvedValue;
                          }];
    }
  } else if (value >= 0.5) {
    return [UISheetPresentationControllerDetent largeDetent];
  } else {
    return [UISheetPresentationControllerDetent mediumDetent];
  }
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

  // Validate and clamp activeDetentIndex to detents bounds
  NSInteger detentCount = _detents.count;
  if (detentCount == 0) {
    return;
  }

  // Clamp index to valid range
  NSInteger clampedIndex = _activeDetentIndex;
  if (clampedIndex < 0) {
    clampedIndex = 0;
  } else if (clampedIndex >= detentCount) {
    clampedIndex = detentCount - 1;
  }

  // Update the stored index if it was clamped
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

- (NSInteger)currentDetentIndex {
  UISheetPresentationController *sheet = self.sheetPresentationController;
  if (!sheet)
    return -1;

  UISheetPresentationControllerDetentIdentifier selectedIdentifier = sheet.selectedDetentIdentifier;
  if (!selectedIdentifier)
    return -1;

  // Find the index by matching the identifier in the detents array
  NSArray<UISheetPresentationControllerDetent *> *detents = sheet.detents;
  for (NSInteger i = 0; i < detents.count; i++) {
    if (@available(iOS 16.0, *)) {
      if ([detents[i].identifier isEqualToString:selectedIdentifier]) {
        return i;
      }
    } else {
      // For iOS 15, we only support system detents (medium/large)
      // Return the index based on the selected identifier
      if ([selectedIdentifier isEqualToString:UISheetPresentationControllerDetentIdentifierMedium]) {
        return 0;
      } else if ([selectedIdentifier isEqualToString:UISheetPresentationControllerDetentIdentifierLarge]) {
        return detents.count - 1;
      }
    }
  }

  return -1;
}

- (CGFloat)currentPosition {
  UIView *presentedView = self.presentedView;
  if (!presentedView)
    return 0.0;

  return presentedView.frame.origin.y;
}

- (CGFloat)bottomInset {
  // No bottom inset for iPad
  if ([UIDevice currentDevice].userInterfaceIdiom == UIUserInterfaceIdiomPad) {
    return 0;
  }

  // Get bottom safe area inset from the window's safe area
  UIWindow *window = [WindowUtil keyWindow];
  return window ? window.safeAreaInsets.bottom : 0;
}

- (CGFloat)currentHeight {
  return self.containerHeight - self.currentPosition - self.bottomInset;
}

- (CGFloat)containerHeight {
  UIView *containerView = self.sheetPresentationController.containerView;
  if (!containerView)
    return 0.0;

  return containerView.frame.size.height;
}

- (void)setupSheetProps {
  UISheetPresentationController *sheet = self.sheetPresentationController;
  if (!sheet) {
    return;
  }

  sheet.delegate = self;

  // Configure page sizing behavior (iOS 17+)
  if (@available(iOS 17.0, *)) {
    sheet.prefersPageSizing = self.pageSizing;
  }

  sheet.prefersEdgeAttachedInCompactHeight = YES;
  sheet.prefersGrabberVisible = self.grabber;
  // Only set preferredCornerRadius if explicitly provided, otherwise use system default
  if (self.cornerRadius) {
    sheet.preferredCornerRadius = [self.cornerRadius floatValue];
  } else {
    sheet.preferredCornerRadius = UISheetPresentationControllerAutomaticDimension;
  }

  self.view.backgroundColor = self.backgroundColor;

  // Setup blur effect if blurTint is provided
  if (self.blurTint && self.blurTint.length > 0) {
    UIBlurEffectStyle style = [ConversionUtil blurEffectStyleFromString:self.blurTint];

    // Create a blur effect view and set it as the background
    UIVisualEffectView *blurView = [[UIVisualEffectView alloc] initWithEffect:[UIBlurEffect effectWithStyle:style]];
    blurView.frame = self.view.bounds;
    blurView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;

    // Insert blur view at the bottom
    [self.view insertSubview:blurView atIndex:0];
  } else {
    // Remove any blur views
    for (UIView *subview in self.view.subviews) {
      if ([subview isKindOfClass:[UIVisualEffectView class]]) {
        [subview removeFromSuperview];
      }
    }
  }
}

#pragma mark - UISheetPresentationControllerDelegate

- (void)sheetPresentationControllerDidChangeSelectedDetentIdentifier:
  (UISheetPresentationController *)sheetPresentationController {
  NSInteger index = [self currentDetentIndex];
  if (index >= 0 && [self.delegate respondsToSelector:@selector(viewControllerDidChangeDetent:position:)]) {
    [self.delegate viewControllerDidChangeDetent:index position:self.currentPosition];
  }
}

#pragma mark - RNSDismissibleModalProtocol

#if RNS_DISMISSIBLE_MODAL_PROTOCOL_AVAILABLE
- (BOOL)isDismissible {
  // Return NO to prevent react-native-screens from dismissing this sheet
  // when presenting a React Navigation modal
  return NO;
}

- (UIViewController *)newPresentingViewController {
  // Return the content view controller as the presenting controller
  // This allows react-native-screens to present modals on top of the sheet's content
  // instead of trying to present on top of the sheet itself
  return self;
}
#endif

@end
