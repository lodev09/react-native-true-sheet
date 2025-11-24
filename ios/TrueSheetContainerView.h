//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@protocol TrueSheetContainerViewDelegate <NSObject>

/**
 * Called when the container's content size changes
 * @param newSize The new size of the content
 */
- (void)containerViewContentDidChangeSize:(CGSize)newSize;

@end

@interface TrueSheetContainerView : RCTViewComponentView

/**
 * Delegate to notify of content size changes
 */
@property (nonatomic, weak, nullable) id<TrueSheetContainerViewDelegate> delegate;

/**
 * Returns the current content height
 */
- (CGFloat)contentHeight;

/**
 * Updates footer layout constraints if needed
 */
- (void)layoutFooter;

/**
 * setup ScrollView pinning
 */
- (void)setupContentScrollViewPinning:(BOOL)pinned;

@end

NS_ASSUME_NONNULL_END

#endif
