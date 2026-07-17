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
@class ScrollableOptions;

NS_ASSUME_NONNULL_BEGIN

@protocol TrueSheetContentViewDelegate <NSObject>

- (void)contentViewDidChangeSize:(CGSize)newSize;
- (void)contentViewScrollViewDidChange;

@end

@interface TrueSheetContentView : RCTViewComponentView <TrueSheetKeyboardObserverDelegate>

@property (nonatomic, weak, nullable) id<TrueSheetContentViewDelegate> delegate;
@property (nonatomic, assign) CGFloat keyboardScrollOffset;
@property (nonatomic, weak, nullable) TrueSheetKeyboardObserver *keyboardObserver;

/**
 * Whether the sheet has an `auto` detent. Deriving the sheet height from the
 * scroll content is circular with natural layout, so the pinned ScrollView's
 * viewport is force-bounded to the container only in this case.
 */
@property (nonatomic, assign) BOOL hasAutoDetent;

/**
 * Content height with the pinned ScrollView's viewport replaced by its content
 * size — the height the content wants regardless of container bounds.
 * Falls back to the frame height when no ScrollView is pinned.
 */
@property (nonatomic, readonly) CGFloat naturalHeight;

- (RCTScrollViewComponentView *_Nullable)findScrollView;

/**
 * Pin the first ScrollView found in the content, wiring insets and keyboard handling
 * @param bottomInset Bottom content inset for the scroll view
 */
- (void)setupScrollableWithBottomInset:(CGFloat)bottomInset;

/**
 * Apply scroll edge effects to the pinned scroll view (iOS 26+)
 */
- (void)applyScrollEdgeEffects:(nullable ScrollableOptions *)options;

@end

NS_ASSUME_NONNULL_END

#endif
