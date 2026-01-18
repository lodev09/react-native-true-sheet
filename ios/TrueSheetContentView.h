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
#import "core/TrueSheetKeyboardObserver.h"

@class TrueSheetViewController;
@class RCTScrollViewComponentView;

NS_ASSUME_NONNULL_BEGIN

@protocol TrueSheetContentViewDelegate <NSObject>

- (void)contentViewDidChangeSize:(CGSize)newSize;
- (void)contentViewDidChangeChildren;

@end

@interface TrueSheetContentView : RCTViewComponentView <TrueSheetKeyboardObserverDelegate>

@property (nonatomic, weak, nullable) id<TrueSheetContentViewDelegate> delegate;
@property (nonatomic, assign) CGFloat keyboardScrollOffset;
@property (nonatomic, weak, nullable) TrueSheetKeyboardObserver *keyboardObserver;

- (RCTScrollViewComponentView *_Nullable)findScrollView;

/**
 * Setup ScrollView pinning
 * @param pinned Whether to pin the scroll view
 * @param bottomInset Bottom content inset for the scroll view
 */
- (void)setupScrollViewPinning:(BOOL)pinned bottomInset:(CGFloat)bottomInset;

/**
 * Update the pinned scroll view's height to fill the container
 */
- (void)updateScrollViewHeight;

@end

NS_ASSUME_NONNULL_END

#endif
