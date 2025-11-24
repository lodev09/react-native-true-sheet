//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface ConversionUtil : NSObject

/**
 * Converts a dashed-case blur tint string to UIBlurEffectStyle
 * @param tintString The blur tint string (e.g., "system-thin-material")
 * @return The corresponding UIBlurEffectStyle, defaults to UIBlurEffectStyleLight if not recognized
 */
+ (UIBlurEffectStyle)blurEffectStyleFromString:(NSString *)tintString;

@end

NS_ASSUME_NONNULL_END
