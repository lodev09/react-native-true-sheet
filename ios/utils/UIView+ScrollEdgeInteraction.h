//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface UIView (ScrollEdgeInteraction)

- (void)setupEdgeInteractionWithScrollView:(nullable UIScrollView *)scrollView
                                      edge:(UIRectEdge)edge API_AVAILABLE(ios(26.0));
- (void)cleanupEdgeInteraction API_AVAILABLE(ios(26.0));

@end

NS_ASSUME_NONNULL_END

#endif
