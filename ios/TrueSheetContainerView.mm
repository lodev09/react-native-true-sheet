//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "TrueSheetContainerView.h"
#import "TrueSheetLayoutUtils.h"
#import <react/renderer/components/TrueSheetSpec/ComponentDescriptors.h>
#import <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>
#import <react/renderer/components/TrueSheetSpec/RCTComponentViewHelpers.h>

using namespace facebook::react;

@implementation TrueSheetContainerView {
    LayoutMetrics _layoutMetrics;
    RCTSurfaceTouchHandler *_touchHandler;
    UIView *_pinnedScrollView;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
    return concreteComponentDescriptorProvider<TrueSheetContainerViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
    if (self = [super initWithFrame:frame]) {
        static const auto defaultProps = std::make_shared<const TrueSheetContainerViewProps>();
        _props = defaultProps;
        
        // Create touch handler for React Native touch events
        _touchHandler = [[RCTSurfaceTouchHandler alloc] init];
        _pinnedScrollView = nil;
    }
    return self;
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics {
    _layoutMetrics = layoutMetrics;
    [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];
}

- (void)didMoveToWindow {
    [super didMoveToWindow];
    
    // Setup scroll view pinning when added to window hierarchy
    // This ensures the view hierarchy is fully established
    if (self.window) {
        // Delay slightly to ensure subviews are mounted
        dispatch_async(dispatch_get_main_queue(), ^{
            [self setupScrollViewPinning];
        });
    }
}

- (void)setupInParentView:(UIView *)parentView {
    // Add to parent view hierarchy
    [parentView addSubview:self];
    
    // Pin to all edges of parent view
    [TrueSheetLayoutUtils pinView:self toParentView:parentView edges:UIRectEdgeAll];
    
    // Ensure container is above background view for touch events
    [parentView bringSubviewToFront:self];
    
    // Attach touch handler for React Native touch events
    if (_touchHandler) {
        [_touchHandler attachToView:self];
    }
}

- (void)setupScrollViewPinning {
    // Get the first child - this is the React component's root view
    if (self.subviews.count == 0) {
        return;
    }
    
    UIView *contentView = self.subviews[0];
    
    // Find scroll view in content view hierarchy
    UIView *scrollView = [self findScrollViewInView:contentView];
    
    if (scrollView && scrollView != _pinnedScrollView) {
        // Unpin previous scroll view if exists
        if (_pinnedScrollView) {
            [TrueSheetLayoutUtils unpinView:_pinnedScrollView];
        }
        
        // Pin the scroll view to its parent (content view)
        UIView *scrollViewParent = scrollView.superview;
        if (scrollViewParent) {
            [TrueSheetLayoutUtils pinView:scrollView toParentView:scrollViewParent edges:UIRectEdgeAll];
            _pinnedScrollView = scrollView;
        }
    }
}

- (UIView *)findScrollViewInView:(UIView *)view {
    // Check if current view is a scroll view
    if ([view isKindOfClass:[UIScrollView class]]) {
        return view;
    }
    
    // Traverse children recursively
    for (UIView *subview in view.subviews) {
        UIView *found = [self findScrollViewInView:subview];
        if (found) {
            return found;
        }
    }
    
    return nil;
}

- (void)cleanup {
    // Detach touch handler
    if (_touchHandler) {
        [_touchHandler detachFromView:self];
    }
    
    // Unpin scroll view if exists
    if (_pinnedScrollView) {
        [TrueSheetLayoutUtils unpinView:_pinnedScrollView];
        _pinnedScrollView = nil;
    }
    
    // Unpin and remove from view hierarchy
    [TrueSheetLayoutUtils unpinView:self];
    [self removeFromSuperview];
}

@end

#endif
