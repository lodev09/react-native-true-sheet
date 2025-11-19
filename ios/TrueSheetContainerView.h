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
 * Sets up the container view in the sheet view
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