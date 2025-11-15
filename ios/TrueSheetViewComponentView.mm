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
#import "TrueSheetModule.h"

#import <react/renderer/components/TrueSheetSpec/ComponentDescriptors.h>
#import <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>
#import <react/renderer/components/TrueSheetSpec/RCTComponentViewHelpers.h>

#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>
#import <React/RCTUtils.h>
#import <React/RCTSurfaceTouchHandler.h>

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
    
    RCTSurfaceTouchHandler *_surfaceTouchHandler;
}

- (instancetype)initWithFrame:(CGRect)frame {
    if (self = [super initWithFrame:frame]) {
        static const auto defaultProps = std::make_shared<const TrueSheetViewProps>();
        _props = defaultProps;
        
        _controller = [[TrueSheetViewController alloc] init];
        _controller.delegate = self;
        _isPresented = NO;
        _activeIndex = nil;
        
        // Touch handler will be created lazily when mounting child view
        _surfaceTouchHandler = nil;
    }
    return self;
}

- (void)didMoveToWindow {
    [super didMoveToWindow];
    
    // Register this view with the TurboModule when added to window
    // This ensures the tag is properly set by the framework
    if (self.window && self.tag > 0) {
        [TrueSheetModule registerView:self withTag:@(self.tag)];
    }
}

- (void)dealloc {
    [self invalidate];
    // Unregister this view from the TurboModule
    [TrueSheetModule unregisterViewWithTag:@(self.tag)];
}

- (void)invalidate {
    if (_isPresented && _controller) {
        // Dismiss without animation during cleanup to avoid crashes
        [_controller dismissViewControllerAnimated:NO completion:nil];
        _isPresented = NO;
    }
    
    // Detach touch handler only if containerView exists
    if (_containerView && _surfaceTouchHandler) {
        [_surfaceTouchHandler detachFromView:_containerView];
        _surfaceTouchHandler = nil;
    }
    
    // Clear references
    _controller.delegate = nil;
    _containerView = nil;
    _contentView = nil;
    _footerView = nil;
    _scrollView = nil;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider {
    return concreteComponentDescriptorProvider<TrueSheetViewComponentDescriptor>();
}

#pragma mark - RCTTrueSheetViewViewProtocol (Commands)

- (void)present:(NSInteger)index {
    [self presentAtIndex:index animated:YES completion:nil];
}

- (void)dismiss {
    [self dismissAnimated:YES completion:nil];
}

#pragma mark - Async Methods (For TurboModule)

- (void)presentAtIndex:(NSInteger)index 
              animated:(BOOL)animated
            completion:(nullable TrueSheetCompletionBlock)completion {
    
    if (_isPresented) {
        [_controller resizeToIndex:index];
        if (completion) {
            completion(YES, nil);
        }
        return;
    }
    
    UIViewController *rootViewController = [self _findPresentingViewController];
    if (!rootViewController) {
        NSError *error = [NSError errorWithDomain:@"com.lodev09.TrueSheet"
                                             code:1001
                                         userInfo:@{
            NSLocalizedDescriptionKey: @"No root view controller found"
        }];
        
        NSLog(@"[TrueSheet] Error: No root view controller found");
        
        if (completion) {
            completion(NO, error);
        }
        return;
    }
    
    _isPresented = YES;
    _activeIndex = @(index);
    
    // Prepare the sheet with the correct initial index before presenting
    [_controller prepareForPresentationAtIndex:index completion:^{
        [rootViewController presentViewController:self->_controller animated:animated completion:^{
            // Optionally resize if needed after presentation
            // [self->_controller resizeToIndex:index];
        
        // Emit event
        if (self->_eventEmitter) {
            auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(self->_eventEmitter);
            NSDictionary *sizeInfo = [self->_controller currentSizeInfo];
            CGFloat sizeValue = sizeInfo ? [sizeInfo[@"value"] doubleValue] : 0.0;
            
            TrueSheetViewEventEmitter::OnPresent event;
            event.index = static_cast<int>(index);
            event.value = static_cast<double>(sizeValue);
            emitter->onPresent(event);
        }
        
            // Call completion handler
            if (completion) {
                completion(YES, nil);
            }
        }];
    }];
}

- (void)dismissAnimated:(BOOL)animated 
             completion:(nullable TrueSheetCompletionBlock)completion {
    
    if (!_isPresented) {
        if (completion) {
            completion(YES, nil);
        }
        return;
    }
    
    [_controller dismissViewControllerAnimated:animated completion:^{
        if (completion) {
            completion(YES, nil);
        }
    }];
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
        if (newViewProps.background != 0) {
            UIColor *color = RCTUIColorFromSharedColor(SharedColor(newViewProps.background));
            _controller.backgroundColor = color;
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
        if (newViewProps.cornerRadius != 0.0) {
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
    }
    
    // Update dimmedIndex
    if (oldViewProps.dimmedIndex != newViewProps.dimmedIndex) {
        if (newViewProps.dimmedIndex >= 0) {
            _controller.dimmedIndex = @(newViewProps.dimmedIndex);
        }
    }
    
    // Update content height
    if (oldViewProps.contentHeight != newViewProps.contentHeight) {
        if (newViewProps.contentHeight != 0.0) {
            _controller.contentHeight = @(newViewProps.contentHeight);
        }
    }
    
    // Update footer height
    if (oldViewProps.footerHeight != newViewProps.footerHeight) {
        if (newViewProps.footerHeight != 0.0) {
            _controller.footerHeight = @(newViewProps.footerHeight);
        }
    }
    
    // Update scrollable handle
    if (oldViewProps.scrollableHandle != newViewProps.scrollableHandle) {
        if (newViewProps.scrollableHandle > 0) {
            UIView *scrollView = [self.superview viewWithTag:newViewProps.scrollableHandle];
            if (scrollView) {
                _scrollView = scrollView;
            }
        }
    }
    
    [super updateProps:props oldProps:oldProps];
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
    
    // Handle layout changes if needed
    // The sheet controller will handle its own layout through UIViewController lifecycle
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
    if (_containerView != nil) {
        NSLog(@"TrueSheet: Sheet can only have one content view.");
        return;
    }
    
    _containerView = (UIView *)childComponentView;
    // Add above the background view to ensure touch events work
    // backgroundView is at index 0, so we add after it
    [_controller.view addSubview:_containerView];
    
    // Create a new touch handler if needed or attach existing one
    // This is required because the containerView is not managed by React Native's view hierarchy
    if (!_surfaceTouchHandler) {
        _surfaceTouchHandler = [[RCTSurfaceTouchHandler alloc] init];
    }
    [_surfaceTouchHandler attachToView:_containerView];
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
        
        // Ensure containerView is above backgroundView for touch events
        [_controller.view bringSubviewToFront:_containerView];
        
        if (_contentView) {
            const auto &props = *std::static_pointer_cast<TrueSheetViewProps const>(_props);
            if (props.contentHeight != 0.0) {
                _controller.contentHeight = @(props.contentHeight);
            }
        }
        
        if (_footerView) {
            [self setupFooterConstraints];
            const auto &props = *std::static_pointer_cast<TrueSheetViewProps const>(_props);
            if (props.footerHeight != 0.0) {
                _controller.footerHeight = @(props.footerHeight);
            }
        }
        
        // Handle initial presentation
        const auto &props = *std::static_pointer_cast<TrueSheetViewProps const>(_props);
        if (props.initialIndex >= 0) {
            BOOL animated = props.initialIndexAnimated;
            [self presentAtIndex:props.initialIndex animated:animated completion:nil];
        }
        
        // Emit onMount event
        if (_eventEmitter) {
            auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(_eventEmitter);
            TrueSheetViewEventEmitter::OnMount event{};
            emitter->onMount(event);
        }
    }
}

- (void)prepareForRecycle {
    [super prepareForRecycle];
    [self invalidate];
    _isPresented = NO;
    _activeIndex = nil;
    
    // Unregister from the registry
    // Note: Re-registration will happen automatically when the component is reused
    [TrueSheetModule unregisterViewWithTag:@(self.tag)];
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
    if (!_eventEmitter) return;
    
    auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(_eventEmitter);
    TrueSheetViewEventEmitter::OnContainerSizeChange event;
    event.width = static_cast<double>(width);
    event.height = static_cast<double>(_controller.view.bounds.size.height);
    emitter->onContainerSizeChange(event);
}

- (void)viewControllerDidDrag:(UIGestureRecognizerState)state height:(CGFloat)height {
    if (!_eventEmitter) return;
    
    NSInteger index = _activeIndex ? [_activeIndex integerValue] : 0;
    auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(_eventEmitter);
    
    switch (state) {
        case UIGestureRecognizerStateBegan: {
            TrueSheetViewEventEmitter::OnDragBegin beginEvent;
            beginEvent.index = static_cast<int>(index);
            beginEvent.value = static_cast<double>(height);
            emitter->onDragBegin(beginEvent);
            break;
        }
        case UIGestureRecognizerStateChanged: {
            TrueSheetViewEventEmitter::OnDragChange changeEvent;
            changeEvent.index = static_cast<int>(index);
            changeEvent.value = static_cast<double>(height);
            emitter->onDragChange(changeEvent);
            break;
        }
        case UIGestureRecognizerStateEnded:
        case UIGestureRecognizerStateCancelled: {
            TrueSheetViewEventEmitter::OnDragEnd endEvent;
            endEvent.index = static_cast<int>(index);
            endEvent.value = static_cast<double>(height);
            emitter->onDragEnd(endEvent);
            break;
        }
        default:
            break;
    }
}

- (void)viewControllerWillAppear {
    // Pin scrollView to contentView if scrollable handle is set
    // Don't pin contentView to containerView - it's already managed by React Native
    if (_scrollView && _contentView) {
        [self pinView:_scrollView toView:_contentView edges:UIRectEdgeAll];
    }
}

- (void)viewControllerDidDismiss {
    _isPresented = NO;
    _activeIndex = nil;
    
    if (_eventEmitter) {
        auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(_eventEmitter);
        TrueSheetViewEventEmitter::OnDismiss event{};
        emitter->onDismiss(event);
    }
}

- (void)viewControllerDidChangeSize:(NSInteger)index value:(CGFloat)value {
    if (!_activeIndex || [_activeIndex integerValue] != index) {
        _activeIndex = @(index);
        
        if (_eventEmitter) {
            auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(_eventEmitter);
            TrueSheetViewEventEmitter::OnSizeChange event;
            event.index = static_cast<int>(index);
            event.value = static_cast<double>(value);
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

#pragma mark - Private Helpers

- (UIViewController *)_findPresentingViewController {
    // Find the root view controller from the window
    UIWindow *keyWindow = nil;
    
    // Get key window (iOS 15.1+ guaranteed)
    NSArray<UIWindow *> *windows = [[UIApplication sharedApplication] windows];
    for (UIWindow *window in windows) {
        if (window.isKeyWindow) {
            keyWindow = window;
            break;
        }
    }
    
    if (!keyWindow) {
        keyWindow = [[UIApplication sharedApplication] keyWindow];
    }
    
    UIViewController *rootViewController = keyWindow.rootViewController;
    
    // Find the top-most presented view controller
    while (rootViewController.presentedViewController) {
        rootViewController = rootViewController.presentedViewController;
    }
    
    return rootViewController;
}

@end

Class<RCTComponentViewProtocol> TrueSheetViewCls(void) {
    return TrueSheetViewComponentView.class;
}

#endif // RCT_NEW_ARCH_ENABLED
