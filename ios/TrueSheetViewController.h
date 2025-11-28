//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import <UIKit/UIKit.h>

#if __has_include(<RNScreens/RNSDismissibleModalProtocol.h>)
#import <RNScreens/RNSDismissibleModalProtocol.h>
#define RNS_DISMISSIBLE_MODAL_PROTOCOL_AVAILABLE 1
#else
#define RNS_DISMISSIBLE_MODAL_PROTOCOL_AVAILABLE 0
#endif

NS_ASSUME_NONNULL_BEGIN

@protocol TrueSheetViewControllerDelegate <NSObject>

- (void)viewControllerWillPresent;
- (void)viewControllerDidPresent;
- (void)viewControllerWillDismiss;
- (void)viewControllerDidDismiss;
- (void)viewControllerDidChangeDetent:(NSInteger)index position:(CGFloat)position;
- (void)viewControllerDidDrag:(UIGestureRecognizerState)state index:(NSInteger)index position:(CGFloat)position;
- (void)viewControllerDidChangePosition:(CGFloat)index
                               position:(CGFloat)position
                                 detent:(CGFloat)detent
                          transitioning:(BOOL)transitioning;
- (void)viewControllerDidChangeSize:(CGSize)size;
- (void)viewControllerDidFocus;
- (void)viewControllerDidBlur;

@end

@interface TrueSheetViewController : UIViewController <UISheetPresentationControllerDelegate
#if RNS_DISMISSIBLE_MODAL_PROTOCOL_AVAILABLE
                                       ,
                                       RNSDismissibleModalProtocol
#endif
                                       >

@property (nonatomic, weak, nullable) id<TrueSheetViewControllerDelegate> delegate;
@property (nonatomic, strong) NSArray *detents;
@property (nonatomic, strong, nullable) NSNumber *maxHeight;
@property (nonatomic, strong, nullable) NSNumber *contentHeight;
@property (nonatomic, strong, nullable) NSNumber *headerHeight;
@property (nonatomic, strong, nullable) UIColor *backgroundColor;
@property (nonatomic, strong, nullable) NSNumber *cornerRadius;
@property (nonatomic, assign) BOOL grabber;
@property (nonatomic, assign) BOOL dimmed;
@property (nonatomic, strong, nullable) NSNumber *dimmedDetentIndex;
@property (nonatomic, copy, nullable) NSString *blurTint;
@property (nonatomic, assign) BOOL pageSizing;
@property (nonatomic, assign) BOOL layoutTransitioning;
@property (nonatomic, assign) BOOL isPresented;
@property (nonatomic, assign) NSInteger activeDetentIndex;

- (void)applyActiveDetent;
- (void)setupActiveDetentWithIndex:(NSInteger)index;
- (void)setupSheetDetents;
- (void)setupSheetProps;
- (NSInteger)currentDetentIndex;
- (CGFloat)currentPosition;
- (CGFloat)bottomInset;

@end

NS_ASSUME_NONNULL_END
