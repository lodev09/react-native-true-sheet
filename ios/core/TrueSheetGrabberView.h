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

/// Width of the grabber pill (default: 36)
@property (nonatomic, strong, nullable) NSNumber *grabberWidth;

/// Height of the grabber pill (default: 5)
@property (nonatomic, strong, nullable) NSNumber *grabberHeight;

/// Top margin from the sheet edge (default: 5)
@property (nonatomic, strong, nullable) NSNumber *topMargin;

/// Corner radius of the grabber pill (default: height / 2)
@property (nonatomic, strong, nullable) NSNumber *cornerRadius;

/// Custom color for the grabber (uses vibrancy effect when nil)
@property (nonatomic, strong, nullable) UIColor *color;

/// Adds the grabber view to a parent view with proper constraints
- (void)addToView:(UIView *)parentView;

/// Applies the current configuration to the grabber view
- (void)applyConfiguration;

@end

NS_ASSUME_NONNULL_END
