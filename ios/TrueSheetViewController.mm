//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "TrueSheetViewController.h"
#import "TrueSheetContentView.h"
#import "utils/ConversionUtil.h"
#import "utils/GestureUtil.h"
#import "utils/WindowUtil.h"

#import <React/RCTLog.h>
#import <React/RCTScrollViewComponentView.h>

@interface TrueSheetViewController ()

@end

@implementation TrueSheetViewController {
  CGFloat _lastPosition;
  CGFloat _lastTransitionPosition;
  BOOL _isTransitioning;
  BOOL _isDragging;
  BOOL _isTrackingPositionFromLayout;

  // Hidden view used to track position during native transition animations
  UIView *_fakeTransitionView;
  CADisplayLink *_displayLink;
}

#pragma mark - Initialization

- (instancetype)init {
  if (self = [super initWithNibName:nil bundle:nil]) {
    _detents = @[ @0.5, @1 ];
    _contentHeight = @(0);
    _headerHeight = @(0);
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

    _fakeTransitionView = [[UIView alloc] init];
    _fakeTransitionView.hidden = YES;
    _fakeTransitionView.userInteractionEnabled = NO;
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

- (CGFloat)bottomInset {
  if ([UIDevice currentDevice].userInterfaceIdiom == UIUserInterfaceIdiomPad) {
    return 0;
  }
  UIWindow *window = [WindowUtil keyWindow];
  return window ? window.safeAreaInsets.bottom : 0;
}

- (CGFloat)currentHeight {
  return self.containerHeight - self.currentPosition - self.bottomInset;
}

- (CGFloat)containerHeight {
  UIView *sheetContainerView = self.sheetPresentationController.containerView;
  return sheetContainerView ? sheetContainerView.frame.size.height : 0.0;
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
    if ([self.delegate respondsToSelector:@selector(viewControllerWillPresent)]) {
      [self.delegate viewControllerWillPresent];
    }
    [self setupTransitionPositionTracking];
  }
}

- (void)viewDidAppear:(BOOL)animated {
  [super viewDidAppear:animated];

  if (!_isPresented) {
    if ([self.delegate respondsToSelector:@selector(viewControllerDidPresent)]) {
      [self.delegate viewControllerDidPresent];
    }
    [self setupGestureRecognizer];
    _isPresented = YES;
  }
}

- (void)viewWillDisappear:(BOOL)animated {
  [super viewWillDisappear:animated];

  if (self.isBeingDismissed && [self.delegate respondsToSelector:@selector(viewControllerWillDismiss)]) {
    [self.delegate viewControllerWillDismiss];
  }

  [self setupTransitionPositionTracking];
  _isTrackingPositionFromLayout = NO;
}

- (void)viewDidDisappear:(BOOL)animated {
  [super viewDidDisappear:animated];

  // Only dispatch didDismiss when actually dismissing (not when another modal is presented on top)
  BOOL isActuallyDismissing = self.presentingViewController == nil || self.isBeingDismissed;

  if (isActuallyDismissing && [self.delegate respondsToSelector:@selector(viewControllerDidDismiss)]) {
    [self.delegate viewControllerDidDismiss];
  }

  _isTrackingPositionFromLayout = NO;

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

  if (!_isTransitioning && self.isActiveAndVisible) {
    _isTrackingPositionFromLayout = YES;

    // Treat position changes as transitioning when another controller is presented on top
    [self emitChangePositionDelegateWithPosition:self.currentPosition
                                   transitioning:_layoutTransitioning || !self.isTopmostPresentedController];

    // On iOS 26, this is called twice when we have a ScrollView
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.4 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
      self->_layoutTransitioning = NO;
    });
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
      if (!_isTrackingPositionFromLayout) {
        [self emitChangePositionDelegateWithPosition:self.currentPosition transitioning:NO];
      }
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

- (void)emitChangePositionDelegateWithPosition:(CGFloat)position transitioning:(BOOL)transitioning {
  if (_lastPosition != position) {
    _lastPosition = position;

    NSInteger index = [self currentDetentIndex];
    if ([self.delegate respondsToSelector:@selector(viewControllerDidChangePosition:position:transitioning:)]) {
      [self.delegate viewControllerDidChangePosition:index position:position transitioning:transitioning];
    }
  }
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
  frame.origin.y = isPresenting ? self.containerHeight : presentedView.frame.origin.y;
  _fakeTransitionView.frame = frame;

  auto animation = ^(id<UIViewControllerTransitionCoordinatorContext> _Nonnull context) {
    [[context containerView] addSubview:self->_fakeTransitionView];

    CGRect finalFrame = presentedView.frame;
    finalFrame.origin.y = presentedView.frame.origin.y;
    self->_fakeTransitionView.frame = finalFrame;

    self->_lastTransitionPosition = finalFrame.origin.y;

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
    BOOL transitioning = NO;
    CGFloat position = presentationLayer.frame.origin.y;

    // If position matches last transition position (within epsilon), sheet is repositioning after drag
    if (fabs(_lastTransitionPosition - position) < 0.5) {
      transitioning = YES;
      position = presentedView.frame.origin.y;
    } else {
      _lastTransitionPosition = position;
    }

    [self emitChangePositionDelegateWithPosition:position transitioning:transitioning];
  }
}

#pragma mark - Sheet Configuration

- (void)setupSheetDetents {
  UISheetPresentationController *sheet = self.sheetPresentationController;
  if (!sheet)
    return;

  NSMutableArray<UISheetPresentationControllerDetent *> *detents = [NSMutableArray array];

  // Subtract bottomInset to prevent iOS from adding extra bottom insets
  CGFloat totalHeight = [self.contentHeight floatValue] + [self.headerHeight floatValue] - self.bottomInset;

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

  // -1 represents "auto" (fit content height)
  if (value == -1) {
    if (@available(iOS 16.0, *)) {
      NSString *detentId = @"custom-auto";
      return [UISheetPresentationControllerDetent
        customDetentWithIdentifier:detentId
                          resolver:^CGFloat(id<UISheetPresentationControllerDetentResolutionContext> context) {
                            CGFloat maxDetentValue = context.maximumDetentValue;
                            CGFloat maxValue =
                              self.maxHeight ? fmin(maxDetentValue, [self.maxHeight floatValue]) : maxDetentValue;
                            return fmin(height, maxValue);
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
    if (value == 1.0) {
      return [UISheetPresentationControllerDetent largeDetent];
    } else if (value == 0.5) {
      return [UISheetPresentationControllerDetent mediumDetent];
    } else {
      NSString *detentId = [NSString stringWithFormat:@"custom-%f", value];
      return [UISheetPresentationControllerDetent
        customDetentWithIdentifier:detentId
                          resolver:^CGFloat(id<UISheetPresentationControllerDetentResolutionContext> context) {
                            CGFloat maxDetentValue = context.maximumDetentValue;
                            CGFloat maxValue =
                              self.maxHeight ? fmin(maxDetentValue, [self.maxHeight floatValue]) : maxDetentValue;
                            return fmin(value * maxDetentValue, maxValue);
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
  sheet.prefersGrabberVisible = self.grabber;

  if (self.cornerRadius) {
    sheet.preferredCornerRadius = [self.cornerRadius floatValue];
  } else {
    sheet.preferredCornerRadius = UISheetPresentationControllerAutomaticDimension;
  }

  self.view.backgroundColor = self.backgroundColor;

  // Setup or remove blur effect
  if (self.blurTint && self.blurTint.length > 0) {
    UIBlurEffectStyle style = [ConversionUtil blurEffectStyleFromString:self.blurTint];
    UIVisualEffectView *blurView = [[UIVisualEffectView alloc] initWithEffect:[UIBlurEffect effectWithStyle:style]];
    blurView.frame = self.view.bounds;
    blurView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [self.view insertSubview:blurView atIndex:0];
  } else {
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
  // Prevent react-native-screens from dismissing this sheet when presenting a modal
  return NO;
}

- (UIViewController *)newPresentingViewController {
  // Allow react-native-screens to present modals on top of the sheet's content
  return self;
}
#endif

@end
