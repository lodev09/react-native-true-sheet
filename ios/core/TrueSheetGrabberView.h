//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface GrabberOptions : NSObject

@property (nonatomic, strong, nullable) NSNumber *width;
@property (nonatomic, strong, nullable) NSNumber *height;
@property (nonatomic, strong, nullable) NSNumber *topMargin;
@property (nonatomic, strong, nullable) NSNumber *cornerRadius;
@property (nonatomic, strong, nullable) UIColor *color;
@property (nonatomic, assign) BOOL adaptive;

@end

@interface AccessibilityOptions : NSObject

@property (nonatomic, copy, nullable) NSString *grabberLabel;
@property (nonatomic, copy, nullable) NSString *grabberHint;
@property (nonatomic, copy, nullable) NSString *expandedValue;
@property (nonatomic, copy, nullable) NSString *collapsedValue;
@property (nonatomic, copy, nullable) NSString *detentValue;

@end

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

/// Whether the grabber color adapts to the background (default: YES)
@property (nonatomic, strong, nullable) NSNumber *adaptive;

/// Custom accessibility strings (uses built-in defaults when nil)
@property (nonatomic, strong, nullable) AccessibilityOptions *accessibilityOptions;

/// Called when the grabber is tapped
@property (nonatomic, copy, nullable) void (^onTap)(void);

/// Called when VoiceOver user swipes up (expand)
@property (nonatomic, copy, nullable) void (^onIncrement)(void);

/// Called when VoiceOver user swipes down (collapse)
@property (nonatomic, copy, nullable) void (^onDecrement)(void);

/// Adds the grabber view to a parent view with proper constraints
- (void)addToView:(UIView *)parentView;

/// Applies the current configuration to the grabber view
- (void)applyConfiguration;

/// Updates the accessibility value based on the current detent position
- (void)updateAccessibilityValueWithIndex:(NSInteger)index detentCount:(NSInteger)count;

@end

NS_ASSUME_NONNULL_END
