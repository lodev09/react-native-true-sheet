//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Root of the embedded navigation controller. Hosts the sheet's container
 * view below the navigation bar and reports its content-area size so Yoga
 * tracks it (detent resizes, large title collapse, search bar reveal).
 */
@interface TrueSheetNavContentViewController : UIViewController

@property (nonatomic, copy, nullable) void (^onLayoutSubviews)(CGSize size);

@end

NS_ASSUME_NONNULL_END
