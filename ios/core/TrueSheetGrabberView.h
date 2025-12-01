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
 * Native grabber (drag handle) view for the bottom sheet.
 * Uses UIVibrancyEffect to adapt color based on the background.
 */
@interface TrueSheetGrabberView : UIView

+ (CGFloat)preferredHeight;

@end

NS_ASSUME_NONNULL_END
