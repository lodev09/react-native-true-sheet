//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "TrueSheetFooterView.h"
#import "TrueSheetLayoutUtils.h"
#import <react/renderer/components/TrueSheetSpec/ComponentDescriptors.h>
#import <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>
#import <react/renderer/components/TrueSheetSpec/RCTComponentViewHelpers.h>

using namespace facebook::react;

@implementation TrueSheetFooterView {
    RCTSurfaceTouchHandler *_touchHandler;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
    return concreteComponentDescriptorProvider<TrueSheetFooterViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
    if (self = [super initWithFrame:frame]) {
        static const auto defaultProps = std::make_shared<const TrueSheetFooterViewProps>();
        _props = defaultProps;
        
        // Set background color to clear by default
        self.backgroundColor = [UIColor clearColor];
        
        // Create touch handler for React Native touch events
        _touchHandler = [[RCTSurfaceTouchHandler alloc] init];
    }
    return self;
}

- (void)willMoveToWindow:(UIWindow *)newWindow {
    [super willMoveToWindow:newWindow];
    
    if (newWindow == nil) {
        // Cleanup when being removed from window
        if (_touchHandler) {
            [_touchHandler detachFromView:self];
        }
        
        [TrueSheetLayoutUtils unpinView:self];
    }
}

- (void)setupInParentView:(UIView *)parentView {
    // Add to parent view hierarchy
    [parentView addSubview:self];
    
    // Measure footer height
    CGSize footerSize = [self systemLayoutSizeFittingSize:UILayoutFittingCompressedSize];
    CGFloat height = footerSize.height > 0 ? footerSize.height : 0;
    
    // Pin to bottom, leading, and trailing edges with height constraint
    [TrueSheetLayoutUtils pinView:self 
                     toParentView:parentView 
                            edges:UIRectEdgeLeft | UIRectEdgeRight | UIRectEdgeBottom 
                           height:height];
    
    // Ensure footer is above container
    [parentView bringSubviewToFront:self];
    
    // Attach touch handler for React Native touch events
    if (_touchHandler) {
        [_touchHandler attachToView:self];
    }
}



@end

#endif
