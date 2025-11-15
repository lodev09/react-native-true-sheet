//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "TrueSheetViewComponentView.h"
#import "TrueSheetViewController.h"
#import "TrueSheetEvent.h"

#import <react/renderer/components/TrueSheetViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/TrueSheetViewSpec/EventEmitters.h>
#import <react/renderer/components/TrueSheetViewSpec/Props.h>
#import <react/renderer/components/TrueSheetViewSpec/RCTComponentViewHelpers.h>

#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>
#import <React/UIView+React.h>

using namespace facebook::react;

@interface TrueSheetViewComponentView () <RCTTrueSheetViewViewProtocol, TrueSheetViewControllerDelegate>
@end

// MARK: - Commands Handler

@implementation TrueSheetViewComponentView (Commands)

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args {
    RCTTrueSheetViewHandleCommand(self, commandName, args);
}

@end

@implementation TrueSheetViewComponentView {
    TrueSheetViewController *_controller;
    UIView *_containerView;
    UIView *_contentView;
    UIView *_footerView;
    UIView *_scrollView;
    
    NSLayoutConstraint *_footerBottomConstraint;
    NSLayoutConstraint *_footerHeightConstraint;
    
    BOOL _isPresented;
    NSNumber *_activeIndex;
}

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

- (void)dealloc {
    [self invalidate];
}

- (void)invalidate {
    if (_isPresented) {
        [_controller dismissViewControllerAnimated:YES completion:nil];
    }
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider {
    return concreteComponentDescriptorProvider<TrueSheetViewComponentDescriptor>();
}

#pragma mark - RCTTrueSheetViewViewProtocol (Commands)

- (void)present:(NSInteger)index {
    [self presentAtIndex:index animated:YES resolve:nil reject:nil];
}

- (void)dismiss {
    [self dismissWithResolve:nil reject:nil];
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps {
    const auto &oldViewProps = *std::static_pointer_cast<TrueSheetViewProps const>(_props);
    const auto &newViewProps = *std::static_pointer_cast<TrueSheetViewProps const>(props);
    
    // Update sizes
    if (oldViewProps.sizes != newViewProps.sizes) {
        NSMutableArray *sizes = [NSMutableArray new];
        for (const auto &size : newViewProps.sizes) {
            [sizes addObject:RCTNSStringFromString(size)];
        }
        _controller.sizes = sizes;
    }
    
    // Update background color
    if (oldViewProps.background != newViewProps.background) {
        if (newViewProps.background) {
            UIColor *color = RCTUIColorFromSharedColor(newViewProps.backgroundColor);
            _controller.sheetBackgroundColor = color;
        }
    }
    
    // Update blur tint
    if (oldViewProps.blurTint != newViewProps.blurTint) {
        if (!newViewProps.blurTint.empty()) {
            _controller.blurTint = RCTNSStringFromString(newViewProps.blurTint);
        }
    }
    
    // Update corner radius
    if (oldViewProps.cornerRadius != newViewProps.cornerRadius) {
        if (newViewProps.cornerRadius) {
            _controller.cornerRadius = @(*newViewProps.cornerRadius);
        }
    }
    
    // Update max height
    if (oldViewProps.maxHeight != newViewProps.maxHeight) {
        if (newViewProps.maxHeight) {
            _controller.maxHeight = @(*newViewProps.maxHeight);
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
    }
    
    // Update dimmedIndex
    if (oldViewProps.dimmedIndex != newViewProps.dimmedIndex) {
        if (newViewProps.dimmedIndex) {
            _controller.dimmedIndex = @(*newViewProps.dimmedIndex);
        }
    }
    
    // Update content height
    if (oldViewProps.contentHeight != newViewProps.contentHeight) {
        if (newViewProps.contentHeight) {
            _controller.contentHeight = @(*newViewProps.contentHeight);
        }
    }
    
    // Update footer height
    if (oldViewProps.footerHeight != newViewProps.footerHeight) {
        if (newViewProps.footerHeight) {
            _controller.footerHeight = @(*newViewProps.footerHeight);
        }
    }
    
    // Update scrollable handle
    if (oldViewProps.scrollableHandle != newViewProps.scrollableHandle) {
        if (newViewProps.scrollableHandle) {
            UIView *scrollView = [self.superview viewWithTag:*newViewProps.scrollableHandle];
            if (scrollView) {
                _scrollView = scrollView;
            }
        }
    }
    
    [super updateProps:props oldProps:oldProps];
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
    if (_containerView != nil) {
        NSLog(@"TrueSheet: Sheet can only have one content view.");
        return;
    }
    
    _containerView = (UIView *)childComponentView;
    [_controller.view addSubview:_containerView];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
    if ((UIView *)childComponentView != _containerView) {
        NSLog(@"TrueSheet: Cannot remove view other than sheet view");
        return;
    }
    
    [self unpinView:_containerView];
    [self unpinView:_footerView];
    [self unpinView:_contentView];
    [self unpinView:_scrollView];
    
    [_containerView removeFromSuperview];
    _containerView = nil;
    _contentView = nil;
    _footerView = nil;
    _scrollView = nil;
}

- (void)layoutSubviews {
    [super layoutSubviews];
    
    if (_containerView != nil && _contentView == nil) {
        if (_containerView.subviews.count >= 1) {
            _contentView = _containerView.subviews[0];
        }
        if (_containerView.subviews.count >= 2) {
            _footerView = _containerView.subviews[1];
        }
        
        [self pinView:_containerView toView:_controller.view edges:UIRectEdgeAll];
        
        if (_contentView) {
            const auto &props = *std::static_pointer_cast<TrueSheetViewProps const>(_props);
            if (props.contentHeight) {
                _controller.contentHeight = @(*props.contentHeight);
            }
        }
        
        if (_footerView) {
            [self setupFooterConstraints];
            const auto &props = *std::static_pointer_cast<TrueSheetViewProps const>(_props);
            if (props.footerHeight) {
                _controller.footerHeight = @(*props.footerHeight);
            }
        }
        
        // Handle initial presentation
        const auto &props = *std::static_pointer_cast<TrueSheetViewProps const>(_props);
        if (props.initialIndex >= 0) {
            BOOL animated = props.initialIndexAnimated;
            [self presentAtIndex:props.initialIndex animated:animated resolve:nil reject:nil];
        }
        
        // Emit onMount event
        if (_eventEmitter) {
            auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(_eventEmitter);
            emitter->onMount({});
        }
    }
}

- (void)prepareForRecycle {
    [super prepareForRecycle];
    [self invalidate];
    _isPresented = NO;
    _activeIndex = nil;
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
    if (!_footerView) return;
    
    _footerView.translatesAutoresizingMaskIntoConstraints = NO;
    [_footerView.leadingAnchor constraintEqualToAnchor:_controller.view.leadingAnchor].active = YES;
    [_footerView.trailingAnchor constraintEqualToAnchor:_controller.view.trailingAnchor].active = YES;
    
    _footerBottomConstraint = [_footerView.bottomAnchor constraintEqualToAnchor:_controller.view.bottomAnchor];
    _footerBottomConstraint.active = YES;
}

- (void)unpinView:(UIView *)view {
    if (!view) return;
    view.translatesAutoresizingMaskIntoConstraints = YES;
    [view removeConstraints:view.constraints];
}

#pragma mark - Public Methods

- (void)presentAtIndex:(NSInteger)index resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [self presentAtIndex:index animated:YES resolve:resolve reject:reject];
}

- (void)presentAtIndex:(NSInteger)index animated:(BOOL)animated resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    if (_isPresented) {
        [_controller resizeToIndex:index];
        if (resolve) {
            resolve(nil);
        }
        return;
    }
    
    UIViewController *rootViewController = RCTPresentedViewController();
    if (!rootViewController) {
        if (reject) {
            reject(@"Error", @"No root view controller found", nil);
        }
        return;
    }
    
    _isPresented = YES;
    _activeIndex = @(index);
    
    [rootViewController presentViewController:_controller animated:animated completion:^{
        [self->_controller resizeToIndex:index];
        
        // Emit onPresent event
        if (self->_eventEmitter) {
            auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(self->_eventEmitter);
            TrueSheetViewEventEmitter::OnPresent event;
            event.index = static_cast<int>(index);
            event.value = 0.0; // Will be updated by controller
            emitter->onPresent(event);
        }
        
        if (resolve) {
            resolve(nil);
        }
    }];
}

- (void)dismissWithResolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    if (!_isPresented) {
        if (resolve) {
            resolve(nil);
        }
        return;
    }
    
    [_controller dismissViewControllerAnimated:YES completion:^{
        if (resolve) {
            resolve(nil);
        }
    }];
}

#pragma mark - TrueSheetViewControllerDelegate

- (void)viewControllerKeyboardWillHide {
    _footerBottomConstraint.constant = 0;
    [UIView animateWithDuration:0.3 animations:^{
        [self->_controller.view layoutIfNeeded];
    }];
}

- (void)viewControllerKeyboardWillShow:(CGFloat)keyboardHeight {
    _footerBottomConstraint.constant = -keyboardHeight;
    [UIView animateWithDuration:0.3 animations:^{
        [self->_controller.view layoutIfNeeded];
    }];
}

- (void)viewControllerDidChangeWidth:(CGFloat)width {
    if (_eventEmitter) {
        auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(_eventEmitter);
        TrueSheetViewEventEmitter::OnContainerSizeChange event;
        event.width = width;
        event.height = 0.0; // Height not tracked in this callback
        emitter->onContainerSizeChange(event);
    }
}

- (void)viewControllerDidDrag:(UIGestureRecognizerState)state height:(CGFloat)height {
    if (!_eventEmitter) return;
    
    NSInteger index = _activeIndex ? [_activeIndex integerValue] : 0;
    auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(_eventEmitter);
    
    TrueSheetViewEventEmitter::OnDragBegin event;
    event.index = static_cast<int>(index);
    event.value = height;
    
    switch (state) {
        case UIGestureRecognizerStateBegan:
            emitter->onDragBegin(event);
            break;
        case UIGestureRecognizerStateChanged:
            emitter->onDragChange(event);
            break;
        case UIGestureRecognizerStateEnded:
        case UIGestureRecognizerStateCancelled:
            emitter->onDragEnd(event);
            break;
        default:
            break;
    }
}

- (void)viewControllerWillAppear {
    if (_contentView && _scrollView && _containerView) {
        [self pinView:_contentView toView:_containerView edges:UIRectEdgeAll];
        [self pinView:_scrollView toView:_contentView edges:UIRectEdgeAll];
    }
}

- (void)viewControllerDidDismiss {
    _isPresented = NO;
    _activeIndex = nil;
    
    if (_eventEmitter) {
        auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(_eventEmitter);
        emitter->onDismiss({});
    }
}

- (void)viewControllerDidChangeSize:(NSInteger)index value:(CGFloat)value {
    if (!_activeIndex || [_activeIndex integerValue] != index) {
        _activeIndex = @(index);
        
        if (_eventEmitter) {
            auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(_eventEmitter);
            TrueSheetViewEventEmitter::OnSizeChange event;
            event.index = static_cast<int>(index);
            event.value = value;
            emitter->onSizeChange(event);
        }
    }
}

#pragma mark - Accessors

- (TrueSheetViewController *)controller {
    return _controller;
}

- (void)setController:(TrueSheetViewController *)controller {
    _controller = controller;
}

@end

Class<RCTComponentViewProtocol> TrueSheetViewCls(void) {
    return TrueSheetViewComponentView.class;
}

#endif // RCT_NEW_ARCH_ENABLED