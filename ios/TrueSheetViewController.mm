//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "TrueSheetViewController.h"
#import "utils/WindowUtil.h"

#import <React/RCTLog.h>

@interface TrueSheetViewController ()

@end

@implementation TrueSheetViewController {
  CGFloat _lastViewWidth;
  CGFloat _lastPosition;
  UIVisualEffectView *_backgroundView;
  CGFloat _bottomInset;
  BOOL _isTransitioning;
  BOOL _isDragging;
  BOOL _isTrackingPositionFromLayout;
  CADisplayLink *_transitionTimer;
}

- (instancetype)init {
  if (self = [super initWithNibName:nil bundle:nil]) {
    _detents = @[ @0.5, @1 ];
    _contentHeight = @(0);
    _grabber = YES;
    _dimmed = YES;
    _dimmedIndex = @(0);
    _lastViewWidth = 0;
    _lastPosition = 0;
    _isTransitioning = NO;
    _isDragging = NO;
    _isTrackingPositionFromLayout = NO;
    _layoutTransitioning = NO;

    _backgroundView = [[UIVisualEffectView alloc] init];
    _backgroundView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;

    // Get bottom safe area inset from the window's safe area
    // The sheet's view has smaller insets, so we need the actual device insets
    UIWindow *window = [WindowUtil keyWindow];
    _bottomInset = window ? window.safeAreaInsets.bottom : 0;
  }
  return self;
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
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
  _backgroundView.frame = self.view.bounds;
  [self.view insertSubview:self->_backgroundView atIndex:0];
}

- (void)viewWillAppear:(BOOL)animated {
  [super viewWillAppear:animated];

  if ([self.delegate respondsToSelector:@selector(viewControllerWillAppear)]) {
    [self.delegate viewControllerWillAppear];
  }

  [self setupGestureRecognizer];
  [self setupTransitionPositionTracking];
}

- (void)viewDidAppear:(BOOL)animated {
  [super viewDidAppear:animated];

  if ([self.delegate respondsToSelector:@selector(viewControllerDidAppear)]) {
    [self.delegate viewControllerDidAppear];
  }
}

- (void)viewWillDisappear:(BOOL)animated {
  [super viewWillDisappear:animated];

  if ([self.delegate respondsToSelector:@selector(viewControllerWillDismiss)]) {
    [self.delegate viewControllerWillDismiss];
  }

  [self setupTransitionPositionTracking];
  _isTrackingPositionFromLayout = NO;
}

- (void)viewDidDisappear:(BOOL)animated {
  [super viewDidDisappear:animated];
  if ([self.delegate respondsToSelector:@selector(viewControllerDidDismiss)]) {
    [self.delegate viewControllerDidDismiss];
  }

  _isTrackingPositionFromLayout = NO;
}

- (void)viewDidLayoutSubviews {
  [super viewDidLayoutSubviews];

  UIView *presentedView = self.presentedView;
  if (presentedView) {
    // Detect width changes (e.g., device rotation) and trigger size recalculation
    // This is essential for "auto" sizing to work correctly
    if (_lastViewWidth != presentedView.frame.size.width) {
      _lastViewWidth = presentedView.frame.size.width;

      // Recalculate detents with new width
      [self setupSheetDetents];
    }
  }

  if (!_isTransitioning && self.isActiveAndVisible) {
    // Flag that we are tracking position from layout
    _isTrackingPositionFromLayout = YES;

    // If another controller is presented on top, treat position changes as transitioning
    // This prevents incorrect position notifications when overlays adjust our size
    [self emitChangePositionDelegate:_layoutTransitioning || !self.isTopmostPresentedController];

    // Reset layout transitioning after sending notification
    _layoutTransitioning = NO;
  }
}

#pragma mark - Gesture Handling

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
        [self emitChangePositionDelegate:NO];
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

- (void)emitChangePositionDelegate:(BOOL)transitioning {
  if (_lastPosition != self.currentPosition) {
    _lastPosition = self.currentPosition;

    // Emit position change delegate
    NSInteger index = [self currentDetentIndex];

    if ([self.delegate respondsToSelector:@selector(viewControllerDidChangePosition:position:transitioning:)]) {
      [self.delegate viewControllerDidChangePosition:index position:self.currentPosition transitioning:transitioning];
    }
  }
}

- (void)setupTransitionPositionTracking {
  if (self.transitionCoordinator != nil) {
    _isTransitioning = YES;
    auto animation = ^(id<UIViewControllerTransitionCoordinatorContext> _Nonnull context) {
      self->_transitionTimer = [CADisplayLink displayLinkWithTarget:self selector:@selector(handleTransitionAnimation)];
      [self->_transitionTimer addToRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
    };

    [self.transitionCoordinator
      animateAlongsideTransition:animation
                      completion:^(id<UIViewControllerTransitionCoordinatorContext> _Nonnull context) {
                        [self->_transitionTimer invalidate];
                        self->_isTransitioning = NO;
                      }];
  }
}

- (void)handleTransitionAnimation {
  if (!_isDragging) {
    [self emitChangePositionDelegate:YES];
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
  CGFloat totalHeight = [self.contentHeight floatValue] - _bottomInset;

  for (NSInteger index = 0; index < self.detents.count; index++) {
    id detent = self.detents[index];
    UISheetPresentationControllerDetent *sheetDetent = [self detentForValue:detent
                                                                 withHeight:totalHeight
                                                                    atIndex:index];
    [detents addObject:sheetDetent];
  }

  sheet.detents = detents;
  
  // Setup dimmed background
  if (self.dimmed && [self.dimmedIndex integerValue] == 0) {
    sheet.largestUndimmedDetentIdentifier = nil;
  } else {
    sheet.largestUndimmedDetentIdentifier = UISheetPresentationControllerDetentIdentifierLarge;

    if (@available(iOS 16.0, *)) {
      if (self.dimmed && self.dimmedIndex) {
        NSInteger dimmedIdx = [self.dimmedIndex integerValue];
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
                            CGFloat maxDetent = context.maximumDetentValue;
                            CGFloat maxValue = self.maxHeight ? MIN(maxDetent, [self.maxHeight floatValue]) : maxDetent;
                            CGFloat resolvedValue = MIN(height, maxValue);
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
    return [UISheetPresentationControllerDetent
      customDetentWithIdentifier:detentId
                        resolver:^CGFloat(id<UISheetPresentationControllerDetentResolutionContext> context) {
                          CGFloat maxDetent = context.maximumDetentValue;
                          CGFloat maxValue = self.maxHeight ? MIN(maxDetent, [self.maxHeight floatValue]) : maxDetent;
                          CGFloat resolvedValue = MIN(value * maxDetent, maxValue);
                          return resolvedValue;
                        }];
  } else {
    return [UISheetPresentationControllerDetent mediumDetent];
  }
}

- (UISheetPresentationControllerDetentIdentifier)detentIdentifierForIndex:(NSInteger)index {
  UISheetPresentationController *sheet = self.sheetPresentationController;
  if (!sheet)
    return UISheetPresentationControllerDetentIdentifierMedium;

  UISheetPresentationControllerDetentIdentifier identifier = UISheetPresentationControllerDetentIdentifierMedium;
  if (index < sheet.detents.count) {
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

- (void)setSheetDetentWithIndex:(NSInteger)index {
  UISheetPresentationController *sheet = self.sheetPresentationController;
  if (!sheet)
    return;

  UISheetPresentationControllerDetentIdentifier identifier = [self detentIdentifierForIndex:index];
  if (identifier) {
    sheet.selectedDetentIdentifier = identifier;
  }
}

- (void)setupGestureRecognizer {
  UIView *presentedView = self.presentedView;
  if (!presentedView)
    return;

  for (UIGestureRecognizer *recognizer in presentedView.gestureRecognizers ?: @[]) {
    if ([recognizer isKindOfClass:[UIPanGestureRecognizer class]]) {
      UIPanGestureRecognizer *panGesture = (UIPanGestureRecognizer *)recognizer;
      [panGesture addTarget:self action:@selector(handlePanGesture:)];
    }
  }
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

- (CGFloat)currentHeight {
  return self.containerHeight - self.currentPosition - _bottomInset;
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
  sheet.prefersEdgeAttachedInCompactHeight = YES;
  sheet.prefersGrabberVisible = self.grabber;
  // Only set preferredCornerRadius if explicitly provided, otherwise use system default
  if (self.cornerRadius) {
    sheet.preferredCornerRadius = [self.cornerRadius floatValue];
  }
  
  // Setup blur effect if blurTint is provided
  if (self.blurTint && self.blurTint.length > 0) {
    UIBlurEffectStyle style = UIBlurEffectStyleLight;

    if ([self.blurTint isEqualToString:@"dark"]) {
      style = UIBlurEffectStyleDark;
    } else if ([self.blurTint isEqualToString:@"light"]) {
      style = UIBlurEffectStyleLight;
    } else if ([self.blurTint isEqualToString:@"extraLight"]) {
      style = UIBlurEffectStyleExtraLight;
    } else if ([self.blurTint isEqualToString:@"regular"]) {
      style = UIBlurEffectStyleRegular;
    } else if ([self.blurTint isEqualToString:@"prominent"]) {
      style = UIBlurEffectStyleProminent;
    } else if ([self.blurTint isEqualToString:@"systemThinMaterial"]) {
      style = UIBlurEffectStyleSystemThinMaterial;
    } else if ([self.blurTint isEqualToString:@"systemMaterial"]) {
      style = UIBlurEffectStyleSystemMaterial;
    } else if ([self.blurTint isEqualToString:@"systemThickMaterial"]) {
      style = UIBlurEffectStyleSystemThickMaterial;
    } else if ([self.blurTint isEqualToString:@"systemChromeMaterial"]) {
      style = UIBlurEffectStyleSystemChromeMaterial;
    } else if ([self.blurTint isEqualToString:@"systemUltraThinMaterial"]) {
      style = UIBlurEffectStyleSystemUltraThinMaterial;
    }

    _backgroundView.effect = [UIBlurEffect effectWithStyle:style];
    _backgroundView.backgroundColor = nil;
  } else {
    // No blur effect, use solid background color
    _backgroundView.effect = nil;
    _backgroundView.backgroundColor = self.backgroundColor;
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

@end
