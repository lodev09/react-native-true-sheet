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

/**
 * Config component for the sheet's native navigation bar. Invisible in the
 * React hierarchy — its props and item children are applied to the embedded
 * navigation controller's bar and the content controller's navigationItem.
 */
@interface TrueSheetNavBarView : RCTViewComponentView

/**
 * Applies the bar config to the embedded navigation host.
 * Item children become bar button custom views / the title view.
 */
- (void)attachToNavigationController:(UINavigationController *)navigationController
               contentViewController:(UIViewController *)contentViewController;

/**
 * Clears the navigationItem and releases the navigation host references.
 * Item children stay owned by their bar button items for re-attachment.
 */
- (void)detach;

@end

NS_ASSUME_NONNULL_END

#endif  // RCT_NEW_ARCH_ENABLED
