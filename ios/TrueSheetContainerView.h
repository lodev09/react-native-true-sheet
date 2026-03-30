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
#import <react/renderer/components/TrueSheetSpec/Props.h>

NS_ASSUME_NONNULL_BEGIN

@interface ScrollableOptions : NSObject

@property (nonatomic, assign) CGFloat keyboardScrollOffset;
@property (nonatomic, assign) BOOL scrollingExpandsSheet;
@property (nonatomic, assign) facebook::react::TrueSheetViewTopScrollEdgeEffect topScrollEdgeEffect;
@property (nonatomic, assign) facebook::react::TrueSheetViewBottomScrollEdgeEffect bottomScrollEdgeEffect;

@end

@protocol TrueSheetContainerViewDelegate <NSObject>

- (void)containerViewContentDidChangeSize:(CGSize)newSize;
- (void)containerViewScrollViewDidChange;

@optional

- (void)containerViewHeaderDidChangeSize:(CGSize)newSize;
- (void)containerViewFooterDidChangeSize:(CGSize)newSize;

@end

@interface TrueSheetContainerView : RCTViewComponentView

/**
 * Delegate to notify of content size changes
 */
@property (nonatomic, weak, nullable) id<TrueSheetContainerViewDelegate> delegate;

/**
 * Enable scrollable content
 */
@property (nonatomic, assign) BOOL scrollableEnabled;

/**
 * Inset adjustment mode for scrollable content
 */
@property (nonatomic, assign) facebook::react::TrueSheetViewInsetAdjustment insetAdjustment;

/**
 * Options for scrollable behavior
 */
@property (nonatomic, strong, nullable) ScrollableOptions *scrollableOptions;

/**
 * Returns the current content height
 */
- (CGFloat)contentHeight;

/**
 * Returns the current header height
 */
- (CGFloat)headerHeight;

/**
 * Returns the current footer height
 */
- (CGFloat)footerHeight;

/**
 * Updates footer layout constraints if needed
 */
- (void)layoutFooter;

/**
 * Setup scrollable content
 */
- (void)setupScrollable;

/**
 * Setup keyboard observer for content and footer
 * @param viewController The sheet view controller to observe keyboard events for
 */
- (void)setupKeyboardObserverWithViewController:(UIViewController *)viewController;

/**
 * Cleanup keyboard observer
 */
- (void)cleanupKeyboardObserver;

@end

NS_ASSUME_NONNULL_END

#endif
