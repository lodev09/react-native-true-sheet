//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "TrueSheetViewController.h"
#import "utils/WindowUtil.h"

@interface TrueSheetViewController ()

@end

@implementation TrueSheetViewController {
  CGFloat _lastViewWidth;
  CGFloat _lastPosition;
  UIVisualEffectView *_backgroundView;
  CGFloat _bottomInset;
  BOOL _isPresenting;
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
  _isPresenting = YES;
}

- (void)viewDidAppear:(BOOL)animated {
  [super viewDidAppear:animated];

  if ([self.delegate respondsToSelector:@selector(viewControllerDidAppear)]) {
    [self.delegate viewControllerDidAppear];
  }

  _isPresenting = NO;
}

- (void)viewWillDisappear:(BOOL)animated {
  [super viewWillDisappear:animated];
}

- (void)viewDidDisappear:(BOOL)animated {
  [super viewDidDisappear:animated];
  if ([self.delegate respondsToSelector:@selector(viewControllerDidDismiss)]) {
    [self.delegate viewControllerDidDismiss];
  }
}

- (void)viewDidLayoutSubviews {
  [super viewDidLayoutSubviews];

  if (!_isPresenting)
    [self emitChangePositionDelegate];

  UIView *presentedView = self.presentedView;
  if (!presentedView)
    return;

  // Detect width changes (e.g., device rotation) and trigger size recalculation
  // This is essential for "auto" sizing to work correctly
  if (_lastViewWidth != presentedView.frame.size.width) {
    _lastViewWidth = presentedView.frame.size.width;

    // Recalculate detents with new width
    [self setupDetents];
  }
}

#pragma mark - Gesture Handling

- (void)handlePanGesture:(UIPanGestureRecognizer *)gesture {
  NSInteger index = [self currentDetentIndex];

  if ([self.delegate respondsToSelector:@selector(viewControllerDidDrag:index:position:)]) {
    [self.delegate viewControllerDidDrag:gesture.state index:index position:self.currentPosition];
  }
}

#pragma mark - Position Tracking

- (void)emitChangePositionDelegate {
  if (_lastPosition != self.currentPosition) {
    _lastPosition = self.currentPosition;

    // Emit position change delegate
    NSInteger index = [self currentDetentIndex];

    if ([self.delegate respondsToSelector:@selector(viewControllerDidChangePosition:position:)]) {
      [self.delegate viewControllerDidChangePosition:index position:self.currentPosition];
    }
  }
}

#pragma mark - Background Setup

- (void)setBlurTint:(NSString *)blurTint {
  _blurTint = blurTint;

  if (blurTint && blurTint.length > 0) {
    UIBlurEffectStyle style = UIBlurEffectStyleLight;

    if ([blurTint isEqualToString:@"dark"]) {
      style = UIBlurEffectStyleDark;
    } else if ([blurTint isEqualToString:@"light"]) {
      style = UIBlurEffectStyleLight;
    } else if ([blurTint isEqualToString:@"extraLight"]) {
      style = UIBlurEffectStyleExtraLight;
    } else if ([blurTint isEqualToString:@"regular"]) {
      style = UIBlurEffectStyleRegular;
    } else if ([blurTint isEqualToString:@"prominent"]) {
      style = UIBlurEffectStyleProminent;
    } else if ([blurTint isEqualToString:@"systemThinMaterial"]) {
      style = UIBlurEffectStyleSystemThinMaterial;
    } else if ([blurTint isEqualToString:@"systemMaterial"]) {
      style = UIBlurEffectStyleSystemMaterial;
    } else if ([blurTint isEqualToString:@"systemThickMaterial"]) {
      style = UIBlurEffectStyleSystemThickMaterial;
    } else if ([blurTint isEqualToString:@"systemChromeMaterial"]) {
      style = UIBlurEffectStyleSystemChromeMaterial;
    } else if ([blurTint isEqualToString:@"systemUltraThinMaterial"]) {
      style = UIBlurEffectStyleSystemUltraThinMaterial;
    }

    self.blurEffect = [UIBlurEffect effectWithStyle:style];
  } else {
    self.blurEffect = nil;
  }

  [self setupBackground];
}

- (void)setupBackground {
  if (self.blurEffect) {
    _backgroundView.effect = self.blurEffect;
    _backgroundView.backgroundColor = nil;
  } else {
    _backgroundView.backgroundColor = self.backgroundColor;
    _backgroundView.effect = nil;
  }
}

#pragma mark - Sheet Configuration (iOS 15+)

- (void)setupDimmedBackground {
  UISheetPresentationController *sheet = self.sheetPresentationController;
  if (!sheet)
    return;

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

- (void)setupDetents {
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
}

- (UISheetPresentationControllerDetent *)detentForFraction:(CGFloat)fraction
                                                withHeight:(CGFloat)height
                                                   atIndex:(NSInteger)index {
  // Fraction should only be > 0 and <= 1
  CGFloat resolvedFraction = fraction <= 0 ? 0.1 : MIN(1, fraction);
  NSString *detentId = [NSString stringWithFormat:@"custom-%f", resolvedFraction];

  if (@available(iOS 16.0, *)) {
    return [UISheetPresentationControllerDetent
      customDetentWithIdentifier:detentId
                        resolver:^CGFloat(id<UISheetPresentationControllerDetentResolutionContext> context) {
                          CGFloat maxDetent = context.maximumDetentValue;
                          CGFloat maxValue = self.maxHeight ? MIN(maxDetent, [self.maxHeight floatValue]) : maxDetent;
                          CGFloat value = MIN(resolvedFraction * maxDetent, maxValue);
                          return value;
                        }];
  } else {
    return [UISheetPresentationControllerDetent mediumDetent];
  }
}

- (UISheetPresentationControllerDetent *)detentForValue:(id)detent withHeight:(CGFloat)height atIndex:(NSInteger)index {
  if ([detent isKindOfClass:[NSNumber class]]) {
    CGFloat fraction = [detent floatValue];
    return [self detentForFraction:fraction withHeight:height atIndex:index];
  } else if ([detent isKindOfClass:[NSString class]]) {
    NSString *stringDetent = (NSString *)detent;

    if ([stringDetent isEqualToString:@"auto"]) {
      if (@available(iOS 16.0, *)) {
        NSString *detentId = @"custom-auto";
        return [UISheetPresentationControllerDetent
          customDetentWithIdentifier:detentId
                            resolver:^CGFloat(id<UISheetPresentationControllerDetentResolutionContext> context) {
                              CGFloat maxDetent = context.maximumDetentValue;
                              CGFloat maxValue =
                                self.maxHeight ? MIN(maxDetent, [self.maxHeight floatValue]) : maxDetent;
                              CGFloat value = MIN(height, maxValue);
                              return value;
                            }];
      }
    } else {
      // Try to parse as a numeric fraction (e.g., "0.5", "0.8")
      CGFloat fraction = [stringDetent floatValue];
      return [self detentForFraction:fraction withHeight:height atIndex:index];
    }
  }

  return [UISheetPresentationControllerDetent mediumDetent];
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

- (void)resizeToIndex:(NSInteger)index {
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
    if ([detents[i].identifier isEqualToString:selectedIdentifier]) {
      return i;
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

- (void)prepareForPresentationAtIndex:(NSInteger)index completion:(void (^)(void))completion {
  UISheetPresentationController *sheet = self.sheetPresentationController;
  if (!sheet) {
    if (completion)
      completion();
    return;
  }

  [self setupDetents];
  [self setupDimmedBackground];

  sheet.delegate = self;
  sheet.prefersEdgeAttachedInCompactHeight = YES;
  sheet.prefersGrabberVisible = self.grabber;
  // Only set preferredCornerRadius if explicitly provided, otherwise use system default
  if (self.cornerRadius) {
    sheet.preferredCornerRadius = [self.cornerRadius floatValue];
  }
  sheet.selectedDetentIdentifier = [self detentIdentifierForIndex:index];

  if (completion)
    completion();
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
