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

- (void)viewControllerDidChangeWidth:(CGFloat)width;
- (void)viewControllerDidDismiss;
- (void)viewControllerDidChangeSize:(NSInteger)index value:(CGFloat)value;
- (void)viewControllerWillAppear;
- (void)viewControllerKeyboardWillShow:(CGFloat)keyboardHeight;
- (void)viewControllerKeyboardWillHide;
- (void)viewControllerDidDrag:(UIGestureRecognizerState)state height:(CGFloat)height;

@end

@interface TrueSheetViewController : UIViewController <UISheetPresentationControllerDelegate>

@property (nonatomic, weak, nullable) id<TrueSheetViewControllerDelegate> delegate;
@property (nonatomic, strong) NSArray *sizes;
@property (nonatomic, strong, nullable) NSNumber *maxHeight;
@property (nonatomic, strong, nullable) NSNumber *contentHeight;
@property (nonatomic, strong, nullable) NSNumber *footerHeight;
@property (nonatomic, strong, nullable) UIColor *backgroundColor;
@property (nonatomic, strong, nullable) UIBlurEffect *blurEffect;
@property (nonatomic, strong, nullable) NSNumber *cornerRadius;
@property (nonatomic, assign) BOOL grabber;
@property (nonatomic, assign) BOOL dimmed;
@property (nonatomic, strong, nullable) NSNumber *dimmedIndex;
@property (nonatomic, copy, nullable) NSString *blurTint;

- (void)setupBackground;
- (void)resizeToIndex:(NSInteger)index;
- (void)setupSizes API_AVAILABLE(ios(15.0));
- (void)setupDimmedBackground API_AVAILABLE(ios(15.0));
- (void)prepareForPresentationAtIndex:(NSInteger)index completion:(void (^)(void))completion;
- (void)observeDrag API_AVAILABLE(ios(15.0));
- (UISheetPresentationControllerDetentIdentifier)detentIdentifierForIndex:(NSInteger)index API_AVAILABLE(ios(15.0));
- (nullable NSDictionary<NSString *, NSNumber *> *)currentSizeInfo;

@end

NS_ASSUME_NONNULL_END