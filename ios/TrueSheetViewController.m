//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "TrueSheetViewController.h"

@interface TrueSheetViewController ()

@property (nonatomic, strong) UIVisualEffectView *backgroundView;
@property (nonatomic, assign) CGFloat lastViewWidth;
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSDictionary *> *detentValues;

@end

@implementation TrueSheetViewController

- (instancetype)init {
    if (self = [super initWithNibName:nil bundle:nil]) {
        _sizes = @[@"medium", @"large"];
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
    self.backgroundView.frame = self.view.bounds;
    [self.view insertSubview:self.backgroundView atIndex:0];
    
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(keyboardWillShow:)
                                                 name:UIKeyboardWillShowNotification
                                               object:nil];
    
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(keyboardWillHide:)
                                                 name:UIKeyboardWillHideNotification
                                               object:nil];
}

- (void)viewWillAppear:(BOOL)animated {
    [super viewWillAppear:animated];
    if ([self.delegate respondsToSelector:@selector(viewControllerWillAppear)]) {
        [self.delegate viewControllerWillAppear];
    }
}

- (void)viewDidDisappear:(BOOL)animated {
    [super viewDidDisappear:animated];
    if ([self.delegate respondsToSelector:@selector(viewControllerDidDismiss)]) {
        [self.delegate viewControllerDidDismiss];
    }
}

- (void)viewDidLayoutSubviews {
    [super viewDidLayoutSubviews];
    
    if (self.lastViewWidth != self.view.frame.size.width) {
        if ([self.delegate respondsToSelector:@selector(viewControllerDidChangeWidth:)]) {
            [self.delegate viewControllerDidChangeWidth:self.view.bounds.size.width];
        }
        self.lastViewWidth = self.view.frame.size.width;
    }
}

#pragma mark - Keyboard Notifications

- (void)keyboardWillShow:(NSNotification *)notification {
    NSDictionary *userInfo = notification.userInfo;
    NSValue *keyboardFrameValue = userInfo[UIKeyboardFrameEndUserInfoKey];
    if (!keyboardFrameValue) return;
    
    CGRect keyboardFrame = [keyboardFrameValue CGRectValue];
    if ([self.delegate respondsToSelector:@selector(viewControllerKeyboardWillShow:)]) {
        [self.delegate viewControllerKeyboardWillShow:keyboardFrame.size.height];
    }
}

- (void)keyboardWillHide:(NSNotification *)notification {
    if ([self.delegate respondsToSelector:@selector(viewControllerKeyboardWillHide)]) {
        [self.delegate viewControllerKeyboardWillHide];
    }
}

#pragma mark - Gesture Handling

- (void)handlePanGesture:(UIPanGestureRecognizer *)gesture {
    UIView *view = gesture.view;
    if (!view) return;
    
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
        self.backgroundView.effect = self.blurEffect;
        self.backgroundView.backgroundColor = nil;
    } else {
        self.backgroundView.backgroundColor = self.backgroundColor;
        self.backgroundView.effect = nil;
    }
}

#pragma mark - Sheet Configuration (iOS 15+)

- (void)setupDimmedBackground {
    UISheetPresentationController *sheet = self.sheetPresentationController;
    if (!sheet) return;
    
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

- (void)setupSizes {
    UISheetPresentationController *sheet = self.sheetPresentationController;
    if (!sheet) return;
    
    [self.detentValues removeAllObjects];
    NSMutableArray<UISheetPresentationControllerDetent *> *detents = [NSMutableArray array];
    
    // Don't subtract bottomInset - the sheet controller handles safe area automatically
    CGFloat totalHeight = [self.contentHeight floatValue] + [self.footerHeight floatValue];
    
    for (NSInteger index = 0; index < self.sizes.count; index++) {
        id size = self.sizes[index];
        UISheetPresentationControllerDetent *detent = [self detentForSize:size
                                                               withHeight:totalHeight
                                                            withMaxHeight:self.maxHeight
                                                                  atIndex:index];
        [detents addObject:detent];
    }
    
    sheet.detents = detents;
}

- (UISheetPresentationControllerDetent *)detentForSize:(id)size
                                            withHeight:(CGFloat)height
                                         withMaxHeight:(NSNumber *)maxHeight
                                               atIndex:(NSInteger)index {
    NSString *detentId = [NSString stringWithFormat:@"custom-%@", size];
    
    if ([size isKindOfClass:[NSNumber class]]) {
        CGFloat floatSize = [size floatValue];
        if (@available(iOS 16.0, *)) {
            return [UISheetPresentationControllerDetent customDetentWithIdentifier:[self identifierFromString:detentId]
                                                                          resolver:^CGFloat(id<UISheetPresentationControllerDetentResolutionContext> context) {
                CGFloat maxDetent = context.maximumDetentValue;
                CGFloat maxValue = maxHeight ? MIN(maxDetent, [maxHeight floatValue]) : maxDetent;
                CGFloat value = MIN(floatSize, maxValue);
                self.detentValues[detentId] = @{@"index": @(index), @"value": @(value)};
                return value;
            }];
        } else {
            self.detentValues[UISheetPresentationControllerDetentIdentifierMedium] = @{@"index": @(index), @"value": @(self.view.frame.size.height / 2)};
            return [UISheetPresentationControllerDetent mediumDetent];
        }
    }
    
    if ([size isKindOfClass:[NSString class]]) {
        NSString *stringSize = (NSString *)size;
        
        if ([stringSize isEqualToString:@"small"]) {
            if (@available(iOS 16.0, *)) {
                return [UISheetPresentationControllerDetent customDetentWithIdentifier:[self identifierFromString:@"small"]
                                                                              resolver:^CGFloat(id<UISheetPresentationControllerDetentResolutionContext> context) {
                    CGFloat maxDetent = context.maximumDetentValue;
                    CGFloat maxValue = maxHeight ? MIN(maxDetent, [maxHeight floatValue]) : maxDetent;
                    CGFloat value = MIN(0.25 * maxDetent, maxValue);
                    self.detentValues[@"small"] = @{@"index": @(index), @"value": @(value)};
                    return value;
                }];
            }
        } else if ([stringSize isEqualToString:@"medium"]) {
            if (@available(iOS 16.0, *)) {
                return [UISheetPresentationControllerDetent customDetentWithIdentifier:UISheetPresentationControllerDetentIdentifierMedium
                                                                              resolver:^CGFloat(id<UISheetPresentationControllerDetentResolutionContext> context) {
                    CGFloat mediumValue = [[UISheetPresentationControllerDetent mediumDetent] resolvedValueInContext:context];
                    CGFloat maxDetent = context.maximumDetentValue;
                    CGFloat maxValue = maxHeight ? MIN(maxDetent, [maxHeight floatValue]) : maxDetent;
                    CGFloat value = MIN(mediumValue, maxValue);
                    self.detentValues[UISheetPresentationControllerDetentIdentifierMedium] = @{@"index": @(index), @"value": @(value)};
                    return value;
                }];
            } else {
                self.detentValues[UISheetPresentationControllerDetentIdentifierMedium] = @{@"index": @(index), @"value": @(self.view.frame.size.height / 2)};
                return [UISheetPresentationControllerDetent mediumDetent];
            }
        } else if ([stringSize isEqualToString:@"large"]) {
            if (@available(iOS 16.0, *)) {
                return [UISheetPresentationControllerDetent customDetentWithIdentifier:UISheetPresentationControllerDetentIdentifierLarge
                                                                              resolver:^CGFloat(id<UISheetPresentationControllerDetentResolutionContext> context) {
                    CGFloat largeValue = [[UISheetPresentationControllerDetent largeDetent] resolvedValueInContext:context];
                    CGFloat maxDetent = context.maximumDetentValue;
                    CGFloat maxValue = maxHeight ? MIN(maxDetent, [maxHeight floatValue]) : maxDetent;
                    CGFloat value = MIN(largeValue, maxValue);
                    self.detentValues[UISheetPresentationControllerDetentIdentifierLarge] = @{@"index": @(index), @"value": @(value)};
                    return value;
                }];
            } else {
                self.detentValues[UISheetPresentationControllerDetentIdentifierLarge] = @{@"index": @(index), @"value": @(self.view.frame.size.height)};
                return [UISheetPresentationControllerDetent largeDetent];
            }
        } else if ([stringSize isEqualToString:@"auto"]) {
            if (@available(iOS 16.0, *)) {
                return [UISheetPresentationControllerDetent customDetentWithIdentifier:[self identifierFromString:detentId]
                                                                              resolver:^CGFloat(id<UISheetPresentationControllerDetentResolutionContext> context) {
                    CGFloat maxDetent = context.maximumDetentValue;
                    CGFloat maxValue = maxHeight ? MIN(maxDetent, [maxHeight floatValue]) : maxDetent;
                    CGFloat value = MIN(height, maxValue);
                    self.detentValues[detentId] = @{@"index": @(index), @"value": @(value)};
                    return value;
                }];
            }
        } else if ([stringSize containsString:@"%"]) {
            if (@available(iOS 16.0, *)) {
                NSString *percentString = [stringSize stringByReplacingOccurrencesOfString:@"%" withString:@""];
                CGFloat percent = [percentString floatValue];
                if (percent > 0.0) {
                    return [UISheetPresentationControllerDetent customDetentWithIdentifier:[self identifierFromString:detentId]
                                                                                  resolver:^CGFloat(id<UISheetPresentationControllerDetentResolutionContext> context) {
                        CGFloat maxDetent = context.maximumDetentValue;
                        CGFloat maxValue = maxHeight ? MIN(maxDetent, [maxHeight floatValue]) : maxDetent;
                        CGFloat value = MIN((percent / 100.0) * maxDetent, maxValue);
                        self.detentValues[detentId] = @{@"index": @(index), @"value": @(value)};
                        return value;
                    }];
                }
            }
        }
    }
    
    self.detentValues[UISheetPresentationControllerDetentIdentifierMedium] = @{@"index": @(index), @"value": @(self.view.frame.size.height / 2)};
    return [UISheetPresentationControllerDetent mediumDetent];
}

- (UISheetPresentationControllerDetentIdentifier)detentIdentifierForIndex:(NSInteger)index {
    UISheetPresentationController *sheet = self.sheetPresentationController;
    if (!sheet) return UISheetPresentationControllerDetentIdentifierMedium;
    
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
    if (!sheet) return;
    
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
    if (!presentedView) return;
    
    for (UIGestureRecognizer *recognizer in presentedView.gestureRecognizers) {
        if ([recognizer isKindOfClass:[UIPanGestureRecognizer class]]) {
            [recognizer addTarget:self action:@selector(handlePanGesture:)];
        }
    }
}

- (NSDictionary *)currentSizeInfo {
    UISheetPresentationController *sheet = self.sheetPresentationController;
    if (!sheet) return nil;
    
    UISheetPresentationControllerDetentIdentifier selectedIdentifier = sheet.selectedDetentIdentifier;
    if (!selectedIdentifier) return nil;
    
    return self.detentValues[selectedIdentifier];
}

- (void)prepareForPresentationAtIndex:(NSInteger)index completion:(void (^)(void))completion {
    UISheetPresentationController *sheet = self.sheetPresentationController;
    if (!sheet) {
        if (completion) completion();
        return;
    }
    
    [self setupSizes];
    [self setupDimmedBackground];
    
    sheet.delegate = self;
    sheet.prefersEdgeAttachedInCompactHeight = YES;
    sheet.prefersGrabberVisible = self.grabber;
    sheet.preferredCornerRadius = self.cornerRadius ? [self.cornerRadius floatValue] : 0;
    sheet.selectedDetentIdentifier = [self detentIdentifierForIndex:index];
    
    if (completion) completion();
}

#pragma mark - UISheetPresentationControllerDelegate

- (void)sheetPresentationControllerDidChangeSelectedDetentIdentifier:(UISheetPresentationController *)sheetPresentationController {
    UISheetPresentationControllerDetentIdentifier identifier = sheetPresentationController.selectedDetentIdentifier;
    if (!identifier) return;
    
    NSDictionary *sizeInfo = self.detentValues[identifier];
    if (sizeInfo && [self.delegate respondsToSelector:@selector(viewControllerDidChangeSize:value:)]) {
        NSInteger index = [sizeInfo[@"index"] integerValue];
        CGFloat value = [sizeInfo[@"value"] floatValue];
        [self.delegate viewControllerDidChangeSize:index value:value];
    }
}

@end