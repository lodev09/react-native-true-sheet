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

@class TrueSheetView;

NS_ASSUME_NONNULL_BEGIN

@protocol TrueSheetContentViewDelegate <NSObject>

- (void)containerViewDidChangeSize:(CGSize)newSize;

@end

@interface TrueSheetContentView : RCTViewComponentView

@property (nonatomic, weak, nullable) id<TrueSheetContentViewDelegate> delegate;

/**
 * Sets up the container view in the sheet view with touch handling
 * @param sheetView The TrueSheetView parent to setup in
 */
- (void)setupInSheetView:(TrueSheetView *)sheetView;

/**
 * Cleans up the container view before removal
 */
- (void)cleanup;

@end

NS_ASSUME_NONNULL_END

#endif