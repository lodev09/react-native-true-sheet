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
 Protocol that provides dynamic measurements for detent calculations.
 Implemented by TrueSheetViewController to supply real-time values.
 */
@protocol TrueSheetDetentCalculatorDelegate <NSObject>

@property (nonatomic, readonly) CGFloat screenHeight;
@property (nonatomic, readonly) CGFloat currentPosition;
@property (nonatomic, strong, readonly) NSArray<NSNumber *> *detents;
@property (nonatomic, strong, readonly, nullable) NSNumber *contentHeight;
@property (nonatomic, strong, readonly, nullable) NSNumber *headerHeight;

@end

/**
 Encapsulates all detent-related calculations for the sheet.
 */
@interface TrueSheetDetentCalculator : NSObject

@property (nonatomic, weak, nullable) id<TrueSheetDetentCalculatorDelegate> delegate;
@property (nonatomic, assign) CGFloat maxDetentHeight;
@property (nonatomic, strong, nullable) NSMutableArray<NSNumber *> *resolvedDetentHeights;

/**
 Returns the detent value (0-1 fraction) for a given index.
 For auto (-1) detents, calculates based on content + header height.
 */
- (CGFloat)detentValueForIndex:(NSInteger)index;

/**
 Returns the estimated screen position (Y coordinate) for a detent index.
 Uses stored resolved positions if available, otherwise calculates from detent value.
 */
- (CGFloat)estimatedPositionForIndex:(NSInteger)index;

/**
 Stores the current resolved position for a detent index.
 Called when the sheet settles at a detent.
 */
- (void)storeResolvedPositionForIndex:(NSInteger)index;

/**
 Finds the segment between detents for a given position.
 Returns YES if position is between two detents, NO if at edges.
 outIndex: The lower detent index of the segment (-1 if above first detent)
 outProgress: Progress within the segment (0-1)
 */
- (BOOL)findSegmentForPosition:(CGFloat)position outIndex:(NSInteger *)outIndex outProgress:(CGFloat *)outProgress;

/**
 Returns a continuous index value representing position between detents.
 Examples: 0.5 means halfway between detent 0 and 1
           -0.3 means 30% toward closed from detent 0
 */
- (CGFloat)interpolatedIndexForPosition:(CGFloat)position;

/**
 Returns the interpolated detent value for a given position.
 Useful for getting a smooth detent value during drag.
 */
- (CGFloat)interpolatedDetentForPosition:(CGFloat)position;

/**
 Clears all stored resolved positions.
 Called when detents configuration changes.
 */
- (void)clearResolvedPositions;

/**
 Sets the count of detents (initializes storage for resolved positions).
 */
- (void)setDetentCount:(NSInteger)count;

@end

NS_ASSUME_NONNULL_END
