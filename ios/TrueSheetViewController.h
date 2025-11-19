//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@protocol TrueSheetViewControllerDelegate <NSObject>

- (void)viewControllerWillAppear;
- (void)viewControllerDidAppear;
- (void)viewControllerWillDismiss;
- (void)viewControllerDidDismiss;
- (void)viewControllerDidChangeDetent:(NSInteger)index position:(CGFloat)position;
- (void)viewControllerDidDrag:(UIGestureRecognizerState)state index:(NSInteger)index position:(CGFloat)position;
- (void)viewControllerDidChangePosition:(NSInteger)index position:(CGFloat)position transitioning:(BOOL)transitioning;

@end

@interface TrueSheetViewController : UIViewController <UISheetPresentationControllerDelegate>

@property (nonatomic, weak, nullable) id<TrueSheetViewControllerDelegate> delegate;
@property (nonatomic, strong) NSArray *detents;
@property (nonatomic, strong, nullable) NSNumber *maxHeight;
@property (nonatomic, strong, nullable) NSNumber *contentHeight;
@property (nonatomic, strong, nullable) UIColor *backgroundColor;
@property (nonatomic, strong, nullable) NSNumber *cornerRadius;
@property (nonatomic, assign) BOOL grabber;
@property (nonatomic, assign) BOOL dimmed;
@property (nonatomic, strong, nullable) NSNumber *dimmedIndex;
@property (nonatomic, copy, nullable) NSString *blurTint;
@property (nonatomic, assign) BOOL layoutTransitioning;

- (void)setupBackground;
- (void)resizeToIndex:(NSInteger)index;
- (void)setupDetents;
- (void)setupDimmedBackground;
- (void)prepareForPresentationAtIndex:(NSInteger)index completion:(void (^)(void))completion;
- (UISheetPresentationControllerDetentIdentifier)detentIdentifierForIndex:(NSInteger)index;
- (NSInteger)currentDetentIndex;
- (CGFloat)currentPosition;
- (CGFloat)currentHeight;

@end

NS_ASSUME_NONNULL_END
