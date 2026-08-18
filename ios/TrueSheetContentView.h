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
@class TrueSheetFooterView;
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
 * Sibling footer view — an absolute footer rises above the keyboard and
 * occludes the content's bottom edge, so it counts toward the keyboard inset.
 */
@property (nonatomic, weak, nullable) TrueSheetFooterView *footerView;

/**
 * Whether the sheet has an `auto` detent. Deriving the sheet height from the
 * scroll content is circular with natural layout, so the detected ScrollView's
 * viewport is force-bounded to the container only in this case.
 */
@property (nonatomic, assign) BOOL hasAutoDetent;

/**
 * Content height measured unconstrained by the shadow node — the height the
 * content wants regardless of container bounds (see
 * TrueSheetContentViewShadowNode). Falls back to the frame height before the
 * first state update.
 */
@property (nonatomic, readonly) CGFloat naturalHeight;

- (RCTScrollViewComponentView *_Nullable)findScrollView;

/**
 * Detect the first ScrollView in the content, wiring keyboard handling
 */
- (void)setupScrollable;

/**
 * Apply scroll edge effects to the detected scroll view (iOS 26+)
 */
- (void)applyScrollEdgeEffects:(nullable ScrollableOptions *)options;

@end

NS_ASSUME_NONNULL_END

#endif
