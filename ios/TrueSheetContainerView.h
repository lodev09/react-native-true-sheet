//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import <React/RCTViewComponentView.h>
#import <React/RCTSurfaceTouchHandler.h>
#import <UIKit/UIKit.h>
#import <react/renderer/core/LayoutMetrics.h>

NS_ASSUME_NONNULL_BEGIN

@interface TrueSheetContainerView : RCTViewComponentView

/**
 * Sets up the container view in the parent view with touch handling
 * @param parentView The parent view to add this container to
 */
- (void)setupInParentView:(UIView *)parentView;

@end

NS_ASSUME_NONNULL_END

#endif
