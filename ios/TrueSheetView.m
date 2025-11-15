//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "TrueSheetView.h"
#import "TrueSheetViewController.h"
#import "TrueSheetEvent.h"
#import <React/RCTUIManager.h>
#import <React/RCTTouchHandler.h>
#import <React/RCTSurfaceTouchHandler.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTConvert.h>
#import <React/UIView+React.h>

@interface TrueSheetView () <TrueSheetViewControllerDelegate>

@property (nonatomic, strong) RCTBridge *bridge;
@property (nonatomic, strong) id<RCTEventDispatcherProtocol> eventDispatcher;
@property (nonatomic, strong) TrueSheetViewController *viewController;
@property (nonatomic, strong) RCTTouchHandler *touchHandler;
@property (nonatomic, strong) RCTSurfaceTouchHandler *surfaceTouchHandler;

@property (nonatomic, assign) BOOL isPresented;
@property (nonatomic, strong, nullable) NSNumber *activeIndex;

@property (nonatomic, strong, nullable) UIView *containerView;
@property (nonatomic, strong, nullable) UIView *contentView;
@property (nonatomic, strong, nullable) UIView *footerView;
@property (nonatomic, strong, nullable) UIView *scrollView;

@property (nonatomic, strong, nullable) NSLayoutConstraint *footerBottomConstraint;
@property (nonatomic, strong, nullable) NSLayoutConstraint *footerHeightConstraint;

@end

@implementation TrueSheetView

- (instancetype)initWithBridge:(RCTBridge *)bridge {
    if (self = [super initWithFrame:CGRectZero]) {
        _bridge = bridge;
        _eventDispatcher = bridge.eventDispatcher;
        _viewController = [[TrueSheetViewController alloc] init];
        _viewController.delegate = self;
        _touchHandler = [[RCTTouchHandler alloc] initWithBridge:bridge];
        _surfaceTouchHandler = [[RCTSurfaceTouchHandler alloc] init];
        _isPresented = NO;
        _initialIndex = @(-1);
        _initialIndexAnimated = YES;
        _grabber = YES;
        _dismissible = YES;
        _dimmed = YES;
    }
    return self;
}

- (void)dealloc {
    [self invalidate];
}

- (void)invalidate {
    if (_isPresented) {
        [_viewController dismissViewControllerAnimated:YES completion:nil];
    }
}

#pragma mark - React Subview Management

- (void)insertReactSubview:(UIView *)subview atIndex:(NSInteger)atIndex {
    [super insertReactSubview:subview atIndex:atIndex];
    
    if (self.containerView != nil) {
        NSLog(@"TrueSheet: Sheet can only have one content view.");
        return;
    }
    
    self.containerView = subview;
    [self.viewController.view addSubview:subview];
    [self.touchHandler attachToView:subview];
    [self.surfaceTouchHandler attachToView:subview];
}

- (void)removeReactSubview:(UIView *)subview {
    if (subview != self.containerView) {
        NSLog(@"TrueSheet: Cannot remove view other than sheet view");
        return;
    }
    
    [super removeReactSubview:subview];
    
    [self.touchHandler detachFromView:subview];
    [self.surfaceTouchHandler detachFromView:subview];
    
    [self unpinView:self.containerView];
    [self unpinView:self.footerView];
    [self unpinView:self.contentView];
    [self unpinView:self.scrollView];
    
    self.containerView = nil;
    self.contentView = nil;
    self.footerView = nil;
    self.scrollView = nil;
}

- (void)didUpdateReactSubviews {
    // Do nothing, as subviews are managed by insertReactSubview
}

- (void)layoutSubviews {
    [super layoutSubviews];
    
    if (self.containerView != nil && self.contentView == nil) {
        if (self.containerView.subviews.count >= 1) {
            self.contentView = self.containerView.subviews[0];
        }
        if (self.containerView.subviews.count >= 2) {
            self.footerView = self.containerView.subviews[1];
        }
        
        [self pinView:self.containerView toView:self.viewController.view edges:UIRectEdgeAll];
        
        if (self.contentView) {
            CGFloat contentHeight = self.contentView.bounds.size.height;
            [self setContentHeight:@(contentHeight)];
        }
        
        if (self.footerView) {
            [self setupFooterConstraints];
            CGFloat footerHeight = self.footerView.bounds.size.height;
            [self setFooterHeight:@(footerHeight)];
        }
        
        NSInteger initialIndex = [self.initialIndex integerValue];
        if (initialIndex >= 0) {
            [self presentAtIndex:initialIndex animated:self.initialIndexAnimated resolve:nil reject:nil];
        }
        
        [self dispatchEventWithName:@"onMount" block:self.onMount data:nil];
    }
}

#pragma mark - Layout Helpers

- (void)pinView:(UIView *)view toView:(UIView *)parentView edges:(UIRectEdge)edges {
    view.translatesAutoresizingMaskIntoConstraints = NO;
    
    if (edges & UIRectEdgeTop) {
        [view.topAnchor constraintEqualToAnchor:parentView.topAnchor].active = YES;
    }
    if (edges & UIRectEdgeBottom) {
        [view.bottomAnchor constraintEqualToAnchor:parentView.bottomAnchor].active = YES;
    }
    if (edges & UIRectEdgeLeft) {
        [view.leadingAnchor constraintEqualToAnchor:parentView.leadingAnchor].active = YES;
    }
    if (edges & UIRectEdgeRight) {
        [view.trailingAnchor constraintEqualToAnchor:parentView.trailingAnchor].active = YES;
    }
}

- (void)setupFooterConstraints {
    if (!self.footerView) return;
    
    self.footerView.translatesAutoresizingMaskIntoConstraints = NO;
    [self.footerView.leadingAnchor constraintEqualToAnchor:self.viewController.view.leadingAnchor].active = YES;
    [self.footerView.trailingAnchor constraintEqualToAnchor:self.viewController.view.trailingAnchor].active = YES;
    
    self.footerBottomConstraint = [self.footerView.bottomAnchor constraintEqualToAnchor:self.viewController.view.bottomAnchor];
    self.footerBottomConstraint.active = YES;
}

- (void)unpinView:(UIView *)view {
    if (!view) return;
    view.translatesAutoresizingMaskIntoConstraints = YES;
    [view removeConstraints:view.constraints];
}

#pragma mark - TrueSheetViewControllerDelegate

- (void)viewControllerKeyboardWillHide {
    self.footerBottomConstraint.constant = 0;
    [UIView animateWithDuration:0.3 animations:^{
        [self.viewController.view layoutIfNeeded];
    }];
}

- (void)viewControllerKeyboardWillShow:(CGFloat)keyboardHeight {
    self.footerBottomConstraint.constant = -keyboardHeight;
    [UIView animateWithDuration:0.3 animations:^{
        [self.viewController.view layoutIfNeeded];
    }];
}

- (void)viewControllerDidChangeWidth:(CGFloat)width {
    [self dispatchEventWithName:@"onContainerSizeChange" 
                          block:self.onContainerSizeChange 
                           data:@{@"width": @(width)}];
}

- (void)viewControllerDidDrag:(UIGestureRecognizerState)state height:(CGFloat)height {
    NSInteger index = self.activeIndex ? [self.activeIndex integerValue] : 0;
    NSDictionary *sizeInfo = @{@"index": @(index), @"value": @(height)};
    
    switch (state) {
        case UIGestureRecognizerStateBegan:
            [self dispatchEventWithName:@"onDragBegin" block:self.onDragBegin data:sizeInfo];
            break;
        case UIGestureRecognizerStateChanged:
            [self dispatchEventWithName:@"onDragChange" block:self.onDragChange data:sizeInfo];
            break;
        case UIGestureRecognizerStateEnded:
        case UIGestureRecognizerStateCancelled:
            [self dispatchEventWithName:@"onDragEnd" block:self.onDragEnd data:sizeInfo];
            break;
        default:
            NSLog(@"TrueSheet: Drag state is not supported");
            break;
    }
}

- (void)viewControllerWillAppear {
    if (self.contentView && self.scrollView && self.containerView) {
        [self pinView:self.contentView toView:self.containerView edges:UIRectEdgeAll];
        [self pinView:self.scrollView toView:self.contentView edges:UIRectEdgeAll];
    }
}

- (void)viewControllerDidDismiss {
    self.isPresented = NO;
    self.activeIndex = nil;
    [self dispatchEventWithName:@"onDismiss" block:self.onDismiss data:nil];
}

- (void)viewControllerDidChangeSize:(NSInteger)index value:(CGFloat)value {
    if (!self.activeIndex || [self.activeIndex integerValue] != index) {
        self.activeIndex = @(index);
        NSDictionary *sizeInfo = @{@"index": @(index), @"value": @(value)};
        [self dispatchEventWithName:@"onSizeChange" block:self.onSizeChange data:sizeInfo];
    }
}

#pragma mark - Property Setters

- (void)setDismissible:(BOOL)dismissible {
    _dismissible = dismissible;
    self.viewController.modalInPresentation = !dismissible;
}

- (void)setMaxHeight:(NSNumber *)maxHeight {
    if ([_maxHeight isEqualToNumber:maxHeight]) return;
    _maxHeight = maxHeight;
    self.viewController.maxHeight = maxHeight;
    
    if (@available(iOS 15.0, *)) {
        if (self.isPresented) {
            [self.viewController setupSizes];
        }
    }
}

- (void)setContentHeight:(NSNumber *)contentHeight {
    if ([_contentHeight isEqualToNumber:contentHeight]) return;
    _contentHeight = contentHeight;
    self.viewController.contentHeight = contentHeight;
    
    if (@available(iOS 15.0, *)) {
        if (self.isPresented) {
            [self.viewController setupSizes];
        }
    }
}

- (void)setFooterHeight:(NSNumber *)footerHeight {
    if (!self.footerView || [_footerHeight isEqualToNumber:footerHeight]) return;
    _footerHeight = footerHeight;
    self.viewController.footerHeight = footerHeight;
    
    if (self.footerView.subviews.firstObject != nil) {
        [self.containerView bringSubviewToFront:self.footerView];
        if (!self.footerHeightConstraint) {
            self.footerHeightConstraint = [self.footerView.heightAnchor constraintEqualToConstant:[footerHeight floatValue]];
            self.footerHeightConstraint.active = YES;
        } else {
            self.footerHeightConstraint.constant = [footerHeight floatValue];
        }
    } else {
        [self.containerView sendSubviewToBack:self.footerView];
        if (self.footerHeightConstraint) {
            self.footerHeightConstraint.constant = 0;
        }
    }
    
    if (@available(iOS 15.0, *)) {
        if (self.isPresented) {
            [self.viewController setupSizes];
        }
    }
}

- (void)setSizes:(NSArray *)sizes {
    _sizes = sizes;
    self.viewController.sizes = sizes;
    
    if (@available(iOS 15.0, *)) {
        if (self.isPresented) {
            [self.viewController setupSizes];
        }
    }
}

- (void)setBackground:(NSNumber *)background {
    _background = background;
    self.viewController.backgroundColor = [RCTConvert UIColor:background];
    [self.viewController setupBackground];
}

- (void)setBlurTint:(NSString *)blurTint {
    _blurTint = blurTint;
    if (blurTint) {
        self.viewController.blurEffect = [self blurEffectFromString:blurTint];
    } else {
        self.viewController.blurEffect = nil;
    }
    [self.viewController setupBackground];
}

- (void)setCornerRadius:(NSNumber *)cornerRadius {
    _cornerRadius = cornerRadius;
    self.viewController.cornerRadius = cornerRadius;
    
    if (@available(iOS 15.0, *)) {
        if (self.isPresented && self.viewController.sheetPresentationController) {
            UISheetPresentationController *sheet = self.viewController.sheetPresentationController;
            [sheet animateChanges:^{
                sheet.preferredCornerRadius = cornerRadius ? [cornerRadius floatValue] : 0;
            }];
        }
    }
}

- (void)setGrabber:(BOOL)grabber {
    _grabber = grabber;
    self.viewController.grabber = grabber;
    
    if (@available(iOS 15.0, *)) {
        if (self.isPresented && self.viewController.sheetPresentationController) {
            UISheetPresentationController *sheet = self.viewController.sheetPresentationController;
            [sheet animateChanges:^{
                sheet.prefersGrabberVisible = grabber;
            }];
        }
    }
}

- (void)setDimmed:(BOOL)dimmed {
    if (_dimmed == dimmed) return;
    _dimmed = dimmed;
    self.viewController.dimmed = dimmed;
    
    if (@available(iOS 15.0, *)) {
        if (self.isPresented) {
            [self.viewController setupDimmedBackground];
        }
    }
}

- (void)setDimmedIndex:(NSNumber *)dimmedIndex {
    if ([_dimmedIndex isEqualToNumber:dimmedIndex]) return;
    _dimmedIndex = dimmedIndex;
    self.viewController.dimmedIndex = dimmedIndex;
    
    if (@available(iOS 15.0, *)) {
        if (self.isPresented) {
            [self.viewController setupDimmedBackground];
        }
    }
}

- (void)setScrollableHandle:(NSNumber *)scrollableHandle {
    _scrollableHandle = scrollableHandle;
    self.scrollView = [self.bridge.uiManager viewForReactTag:scrollableHandle];
}

#pragma mark - Helper Methods

- (UIBlurEffect *)blurEffectFromString:(NSString *)tint {
    UIBlurEffectStyle style = UIBlurEffectStyleRegular;
    
    if ([tint isEqualToString:@"default"]) {
        style = UIBlurEffectStyleRegular;
    } else if ([tint isEqualToString:@"extraLight"]) {
        style = UIBlurEffectStyleExtraLight;
    } else if ([tint isEqualToString:@"light"]) {
        style = UIBlurEffectStyleLight;
    } else if ([tint isEqualToString:@"regular"]) {
        style = UIBlurEffectStyleRegular;
    } else if ([tint isEqualToString:@"dark"]) {
        style = UIBlurEffectStyleDark;
    } else if ([tint isEqualToString:@"prominent"]) {
        style = UIBlurEffectStyleProminent;
    } else if ([tint isEqualToString:@"systemUltraThinMaterial"]) {
        style = UIBlurEffectStyleSystemUltraThinMaterial;
    } else if ([tint isEqualToString:@"systemThinMaterial"]) {
        style = UIBlurEffectStyleSystemThinMaterial;
    } else if ([tint isEqualToString:@"systemMaterial"]) {
        style = UIBlurEffectStyleSystemMaterial;
    } else if ([tint isEqualToString:@"systemThickMaterial"]) {
        style = UIBlurEffectStyleSystemThickMaterial;
    } else if ([tint isEqualToString:@"systemChromeMaterial"]) {
        style = UIBlurEffectStyleSystemChromeMaterial;
    } else if ([tint isEqualToString:@"systemUltraThinMaterialLight"]) {
        style = UIBlurEffectStyleSystemUltraThinMaterialLight;
    } else if ([tint isEqualToString:@"systemThickMaterialLight"]) {
        style = UIBlurEffectStyleSystemThickMaterialLight;
    } else if ([tint isEqualToString:@"systemThinMaterialLight"]) {
        style = UIBlurEffectStyleSystemThinMaterialLight;
    } else if ([tint isEqualToString:@"systemMaterialLight"]) {
        style = UIBlurEffectStyleSystemMaterialLight;
    } else if ([tint isEqualToString:@"systemChromeMaterialLight"]) {
        style = UIBlurEffectStyleSystemChromeMaterialLight;
    } else if ([tint isEqualToString:@"systemUltraThinMaterialDark"]) {
        style = UIBlurEffectStyleSystemUltraThinMaterialDark;
    } else if ([tint isEqualToString:@"systemThinMaterialDark"]) {
        style = UIBlurEffectStyleSystemThinMaterialDark;
    } else if ([tint isEqualToString:@"systemMaterialDark"]) {
        style = UIBlurEffectStyleSystemMaterialDark;
    } else if ([tint isEqualToString:@"systemThickMaterialDark"]) {
        style = UIBlurEffectStyleSystemThickMaterialDark;
    } else if ([tint isEqualToString:@"systemChromeMaterialDark"]) {
        style = UIBlurEffectStyleSystemChromeMaterialDark;
    }
    
    return [UIBlurEffect effectWithStyle:style];
}

- (void)dispatchEventWithName:(NSString *)name block:(RCTDirectEventBlock)block data:(NSDictionary *)data {
#ifdef RCT_NEW_ARCH_ENABLED
    if (block) {
        block(data);
    }
#else
    TrueSheetEvent *event = [[TrueSheetEvent alloc] initWithViewTag:self.reactTag name:name data:data];
    [self.eventDispatcher sendEvent:event];
#endif
}

#pragma mark - Public Methods

- (void)presentAtIndex:(NSInteger)index resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [self presentAtIndex:index animated:YES resolve:resolve reject:reject];
}

- (void)presentAtIndex:(NSInteger)index animated:(BOOL)animated resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    UIViewController *rvc = self.reactViewController;
    
    if (!rvc) {
        if (reject) {
            reject(@"Error", @"No react view controller present.", nil);
        }
        return;
    }
    
    if (index >= self.viewController.sizes.count) {
        if (reject) {
            reject(@"Error", [NSString stringWithFormat:@"Size at %ld is not configured.", (long)index], nil);
        }
        return;
    }
    
    if (self.isPresented) {
        if (@available(iOS 15.0, *)) {
            UISheetPresentationController *sheet = self.viewController.sheetPresentationController;
            if (sheet) {
                [sheet animateChanges:^{
                    sheet.selectedDetentIdentifier = [self.viewController detentIdentifierForIndex:index];
                    
                    NSDictionary *sizeInfo = [self.viewController currentSizeInfo];
                    if (sizeInfo) {
                        NSInteger currentIndex = [sizeInfo[@"index"] integerValue];
                        CGFloat value = [sizeInfo[@"value"] floatValue];
                        [self viewControllerDidChangeSize:currentIndex value:value];
                    }
                    
                    if (resolve) {
                        resolve(nil);
                    }
                }];
            }
        } else {
            NSDictionary *sizeInfo = [self.viewController currentSizeInfo];
            if (sizeInfo) {
                NSInteger currentIndex = [sizeInfo[@"index"] integerValue];
                CGFloat value = [sizeInfo[@"value"] floatValue];
                [self viewControllerDidChangeSize:currentIndex value:value];
            }
            if (resolve) {
                resolve(nil);
            }
        }
    } else {
        [self.viewController prepareForPresentationAtIndex:index completion:^{
            self.activeIndex = @(index);
            self.isPresented = YES;
            
            [rvc presentViewController:self.viewController animated:animated completion:^{
                if (@available(iOS 15.0, *)) {
                    [self.viewController observeDrag];
                }
                
                NSDictionary *sizeInfo = [self.viewController currentSizeInfo];
                [self dispatchEventWithName:@"onPresent" block:self.onPresent data:sizeInfo];
                
                if (resolve) {
                    resolve(nil);
                }
            }];
        }];
    }
}

- (void)dismissWithResolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    if (!self.isPresented) {
        if (resolve) {
            resolve(nil);
        }
        return;
    }
    
    [self.viewController dismissViewControllerAnimated:YES completion:^{
        if (resolve) {
            resolve(nil);
        }
    }];
}

@end