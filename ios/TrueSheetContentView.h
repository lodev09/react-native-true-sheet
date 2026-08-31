//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import <React/RCTMountingTransactionObserving.h>
#import <React/RCTSurfaceTouchHandler.h>
#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>
#import <react/renderer/core/LayoutMetrics.h>
#import "core/TrueSheetKeyboardObserver.h"

@class TrueSheetViewController;
@class TrueSheetFooterView;
@class RCTScrollViewComponentView;
@class ScrollableOptions;

NS_ASSUME_NONNULL_BEGIN

@protocol TrueSheetContentViewDelegate <NSObject>

- (void)contentViewDidChangeSize:(CGSize)newSize;
- (void)contentViewScrollViewDidChange;

@end

@interface TrueSheetContentView : RCTViewComponentView <TrueSheetKeyboardObserverDelegate, RCTMountingTransactionObserving>

@property (nonatomic, weak, nullable) id<TrueSheetContentViewDelegate> delegate;
@property (nonatomic, assign) CGFloat keyboardScrollOffset;

/**
 * Adjustment added to the keyboard bottom inset applied to the detected
 * scrollable — negative values reduce the inset (e.g. to cancel out safe-area
 * padding already baked into the content's paddingBottom).
 */
@property (nonatomic, assign) CGFloat keyboardOffset;

@property (nonatomic, weak, nullable) TrueSheetKeyboardObserver *keyboardObserver;

/**
 * Sibling footer view — a relative footer shields part of the keyboard's
 * overlap from the inset; an absolute footer extends the caret reveal target.
 */
@property (nonatomic, weak, nullable) TrueSheetFooterView *footerView;

/**
 * Content height measured unconstrained by the shadow node — the height the
 * content wants regardless of container bounds (see
 * TrueSheetContentViewShadowNode). Falls back to the frame height before the
 * first state update.
 */
@property (nonatomic, readonly) CGFloat naturalHeight;

/**
 * React tag of the user-provided scrollable (see the `scrollableRef` prop).
 * Setting a new handle clears the currently resolved ScrollView.
 */
@property (nonatomic, assign) NSInteger scrollableHandle;

/**
 * Sets the resolved ScrollView's `contentInsetAdjustmentBehavior` to
 * `automatic` while plugged so UIKit applies the bottom safe-area inset to
 * the scroll content. The previous behavior is restored on clear.
 */
@property (nonatomic, assign) BOOL contentInsetAdjustment;

- (RCTScrollViewComponentView *_Nullable)findScrollView;

/**
 * Resolve the ScrollView from `scrollableHandle`, wiring keyboard handling
 */
- (void)setupScrollable;

/**
 * Apply scroll edge effects to the detected scroll view (iOS 26+)
 */
- (void)applyScrollEdgeEffects:(nullable ScrollableOptions *)options;

@end

NS_ASSUME_NONNULL_END

#endif
