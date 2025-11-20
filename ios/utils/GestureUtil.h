//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface GestureUtil : NSObject

/**
 * Attaches a pan gesture handler to all pan gesture recognizers on a view
 * @param view The view whose pan gesture recognizers to attach to
 * @param target The target object that will handle the gesture
 * @param selector The selector to call when the gesture is triggered
 */
+ (void)attachPanGestureHandler:(UIView *)view target:(id)target selector:(SEL)selector;

@end

NS_ASSUME_NONNULL_END