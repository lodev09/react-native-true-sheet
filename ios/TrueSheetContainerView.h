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

@class TrueSheetView;
@class TrueSheetViewController;

NS_ASSUME_NONNULL_BEGIN

typedef void (^TrueSheetCompletionBlock)(BOOL success, NSError *_Nullable error);

@interface TrueSheetContainerView : RCTViewComponentView

/**
 * The view controller managing the sheet presentation
 */
@property (nonatomic, readonly, strong) TrueSheetViewController *controller;

/**
 * Sets up the container view in the sheet view
 * @param sheetView The TrueSheetView parent to setup in
 */
- (void)setupInSheetView:(TrueSheetView *)sheetView;

/**
 * Cleans up the container view before removal
 */
- (void)cleanup;

/**
 * Presents the sheet at the specified index
 * @param index The detent index to present at
 * @param animated Whether to animate the presentation
 * @param presentingViewController The view controller to present from
 * @param completion Optional completion handler
 */
- (void)presentAtIndex:(NSInteger)index
                  animated:(BOOL)animated
  presentingViewController:(UIViewController *)presentingViewController
                completion:(nullable TrueSheetCompletionBlock)completion;

/**
 * Dismisses the sheet
 * @param animated Whether to animate the dismissal
 * @param completion Optional completion handler
 */
- (void)dismissAnimated:(BOOL)animated completion:(nullable TrueSheetCompletionBlock)completion;

/**
 * Resizes the sheet to the specified index
 * @param index The detent index to resize to
 */
- (void)resizeToIndex:(NSInteger)index;

/**
 * Applies props from the parent sheet view to the controller
 * Should be called when sheet view props change
 */
- (void)applyPropsFromSheetView;

@end

NS_ASSUME_NONNULL_END

#endif