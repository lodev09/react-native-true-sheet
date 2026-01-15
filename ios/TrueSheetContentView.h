//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import <React/RCTSurfaceTouchHandler.h>
#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>
#import <react/renderer/core/LayoutMetrics.h>

@class TrueSheetViewController;
@class RCTScrollViewComponentView;

NS_ASSUME_NONNULL_BEGIN

@protocol TrueSheetContentViewDelegate <NSObject>

- (void)contentViewDidChangeSize:(CGSize)newSize;
- (void)contentViewDidChangeChildren;
- (void)contentViewDidChangeInsets;

@end

@interface TrueSheetContentView : RCTViewComponentView

@property (nonatomic, weak, nullable) id<TrueSheetContentViewDelegate> delegate;

- (RCTScrollViewComponentView *_Nullable)findScrollView:(UIView *_Nullable *_Nullable)outTopSibling;

/**
 * Setup ScrollView pinning
 * @param pinned Whether to pin the scroll view
 */
- (void)setupScrollViewPinning:(BOOL)pinned;

@end

NS_ASSUME_NONNULL_END

#endif
