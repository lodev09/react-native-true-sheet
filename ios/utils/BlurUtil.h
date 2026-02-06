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

@interface BlurUtil : NSObject

+ (UIBlurEffectStyle)blurEffectStyleFromEnum:(NSInteger)blur;

@end

NS_ASSUME_NONNULL_END

#endif
