//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "TrueSheetViewController.h"

@interface TrueSheetViewController ()

@end

@implementation TrueSheetViewController {
  CGFloat _lastViewWidth;
  UIVisualEffectView *_backgroundView;
  NSMutableDictionary<NSString *, NSDictionary *> *_detentValues;
}

- (instancetype)init {
  if (self = [super initWithNibName:nil bundle:nil]) {
    _detents = @[ @0.5, @1 ];
    _contentHeight = @(0);
    _footerHeight = @(0);
    _grabber = YES;
    _dimmed = YES;
    _dimmedIndex = @(0);
    _lastViewWidth = 0;
    _detentValues = [NSMutableDictionary dictionary];

    _backgroundView = [[UIVisualEffectView alloc] init];
    _backgroundView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  }
  return self;
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)viewDidLoad {
  [super viewDidLoad];

  self.view.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
  _backgroundView.frame = self.view.bounds;
  [self.view insertSubview:self->_backgroundView atIndex:0];
}

- (void)viewDidDisappear:(BOOL)animated {
  [super viewDidDisappear:animated];
  if ([self.delegate respondsToSelector:@selector(viewControllerDidDismiss)]) {
    [self.delegate viewControllerDidDismiss];
  }
}

- (void)viewDidLayoutSubviews {
  [super viewDidLayoutSubviews];

  // Detect width changes (e.g., device rotation) and trigger size recalculation
  // This is essential for "auto" sizing to work correctly
  if (_lastViewWidth != self.view.frame.size.width) {
    _lastViewWidth = self.view.frame.size.width;

    // Recalculate detents with new width
    [self setupDetents];
  }
}

#pragma mark - Gesture Handling

- (void)handlePanGesture:(UIPanGestureRecognizer *)gesture {
  UIView *view = gesture.view;
  if (!view)
    return;

  CGFloat screenHeight = [UIScreen mainScreen].bounds.size.height;
  CGFloat sheetY = view.frame.origin.y;
  CGFloat height = screenHeight - sheetY;

  if ([self.delegate respondsToSelector:@selector(viewControllerDidDrag:height:)]) {
    [self.delegate viewControllerDidDrag:gesture.state height:height];
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

  [_detentValues removeAllObjects];
  NSMutableArray<UISheetPresentationControllerDetent *> *detents = [NSMutableArray array];

  // Don't subtract bottomInset - the sheet controller handles safe area automatically
  CGFloat totalHeight = [self.contentHeight floatValue] + [self.footerHeight floatValue];

  for (NSInteger index = 0; index < self.detents.count; index++) {
    id detent = self.detents[index];
    UISheetPresentationControllerDetent *sheetDetent = [self detentForValue:detent
                                                                 withHeight:totalHeight
                                                              withMaxHeight:self.maxHeight
                                                                    atIndex:index];
    [detents addObject:sheetDetent];
  }

  [sheet animateChanges:^{
    sheet.detents = detents;
  }];
}

- (UISheetPresentationControllerDetent *)detentForValue:(id)detent
                                             withHeight:(CGFloat)height
                                          withMaxHeight:(NSNumber *)maxHeight
                                                atIndex:(NSInteger)index {
  NSString *detentId = [NSString stringWithFormat:@"custom-%@", detent];

  if ([detent isKindOfClass:[NSNumber class]]) {
    CGFloat fraction = [detent floatValue];
    if (@available(iOS 16.0, *)) {
      return [UISheetPresentationControllerDetent
        customDetentWithIdentifier:[self identifierFromString:detentId]
                          resolver:^CGFloat(id<UISheetPresentationControllerDetentResolutionContext> context) {
                            CGFloat maxDetent = context.maximumDetentValue;
                            CGFloat maxValue = maxHeight ? MIN(maxDetent, [maxHeight floatValue]) : maxDetent;
                            CGFloat value = MIN(fraction * maxDetent, maxValue);
                            self->_detentValues[detentId] = @{@"index" : @(index), @"value" : @(value)};
                            return value;
                          }];
    } else {
      _detentValues[UISheetPresentationControllerDetentIdentifierMedium] =
        @{@"index" : @(index), @"value" : @(self.view.frame.size.height / 2)};
      return [UISheetPresentationControllerDetent mediumDetent];
    }
  }

  if ([detent isKindOfClass:[NSString class]]) {
    NSString *stringDetent = (NSString *)detent;

    if ([stringDetent isEqualToString:@"auto"]) {
      if (@available(iOS 16.0, *)) {
        return [UISheetPresentationControllerDetent
          customDetentWithIdentifier:[self identifierFromString:detentId]
                            resolver:^CGFloat(id<UISheetPresentationControllerDetentResolutionContext> context) {
                              CGFloat maxDetent = context.maximumDetentValue;
                              CGFloat maxValue = maxHeight ? MIN(maxDetent, [maxHeight floatValue]) : maxDetent;
                              CGFloat value = MIN(height, maxValue);
                              self->_detentValues[detentId] = @{@"index" : @(index), @"value" : @(value)};
                              return value;
                            }];
      }
    } else {
      // Try to parse as a numeric fraction (e.g., "0.5", "0.8")
      CGFloat fraction = [stringDetent floatValue];
      if (fraction > 0.0) {
        if (@available(iOS 16.0, *)) {
          return [UISheetPresentationControllerDetent
            customDetentWithIdentifier:[self identifierFromString:detentId]
                              resolver:^CGFloat(id<UISheetPresentationControllerDetentResolutionContext> context) {
                                CGFloat maxDetent = context.maximumDetentValue;
                                CGFloat maxValue = maxHeight ? MIN(maxDetent, [maxHeight floatValue]) : maxDetent;
                                CGFloat value = MIN(fraction * maxDetent, maxValue);
                                self->_detentValues[detentId] = @{@"index" : @(index), @"value" : @(value)};
                                return value;
                              }];
        }
      }
    }
  }

  _detentValues[UISheetPresentationControllerDetentIdentifierMedium] =
    @{@"index" : @(index), @"value" : @(self.view.frame.size.height / 2)};
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
    [sheet animateChanges:^{
      sheet.selectedDetentIdentifier = identifier;
    }];
  }
}

- (UISheetPresentationControllerDetentIdentifier)identifierFromString:(NSString *)string {
  return string;
}

- (void)observeDrag {
  UISheetPresentationController *sheet = self.sheetPresentationController;
  UIView *presentedView = sheet.presentedView;
  if (!presentedView)
    return;

  for (UIGestureRecognizer *recognizer in presentedView.gestureRecognizers) {
    if ([recognizer isKindOfClass:[UIPanGestureRecognizer class]]) {
      [recognizer addTarget:self action:@selector(handlePanGesture:)];
    }
  }
}

- (NSDictionary *)currentDetentInfo {
  UISheetPresentationController *sheet = self.sheetPresentationController;
  if (!sheet)
    return nil;

  UISheetPresentationControllerDetentIdentifier selectedIdentifier = sheet.selectedDetentIdentifier;
  if (!selectedIdentifier)
    return nil;

  return _detentValues[selectedIdentifier];
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
  sheet.preferredCornerRadius = self.cornerRadius ? [self.cornerRadius floatValue] : 0;
  sheet.selectedDetentIdentifier = [self detentIdentifierForIndex:index];

  if (completion)
    completion();
}

#pragma mark - UISheetPresentationControllerDelegate

- (void)sheetPresentationControllerDidChangeSelectedDetentIdentifier:
  (UISheetPresentationController *)sheetPresentationController {
  UISheetPresentationControllerDetentIdentifier identifier = sheetPresentationController.selectedDetentIdentifier;
  if (!identifier)
    return;

  NSDictionary *detentInfo = _detentValues[identifier];
  if (detentInfo && [self.delegate respondsToSelector:@selector(viewControllerDidChangeDetent:value:)]) {
    NSInteger index = [detentInfo[@"index"] integerValue];
    CGFloat value = [detentInfo[@"value"] floatValue];
    [self.delegate viewControllerDidChangeDetent:index value:value];
  }
}

@end
