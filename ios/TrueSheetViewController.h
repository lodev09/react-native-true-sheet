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

- (void)viewControllerWillPresentAtIndex:(NSInteger)index position:(CGFloat)position detent:(CGFloat)detent;
- (void)viewControllerDidPresentAtIndex:(NSInteger)index position:(CGFloat)position detent:(CGFloat)detent;
- (void)viewControllerWillDismiss;
- (void)viewControllerDidDismiss;
- (void)viewControllerDidChangeDetent:(NSInteger)index position:(CGFloat)position detent:(CGFloat)detent;
- (void)viewControllerDidDrag:(UIGestureRecognizerState)state
                        index:(NSInteger)index
                     position:(CGFloat)position
                       detent:(CGFloat)detent;
- (void)viewControllerDidChangePosition:(CGFloat)index
                               position:(CGFloat)position
                                 detent:(CGFloat)detent
                               realtime:(BOOL)realtime;
- (void)viewControllerDidChangeSize:(CGSize)size;
- (void)viewControllerWillFocus;
- (void)viewControllerDidFocus;
- (void)viewControllerWillBlur;
- (void)viewControllerDidBlur;

@end

@interface TrueSheetViewController : UIViewController <UISheetPresentationControllerDelegate
#if RNS_DISMISSIBLE_MODAL_PROTOCOL_AVAILABLE
                                       ,
                                       RNSDismissibleModalProtocol
#endif
                                       >

@property (nonatomic, weak, nullable) id<TrueSheetViewControllerDelegate> delegate;
@property (nonatomic, strong) NSArray<NSNumber *> *detents;
@property (nonatomic, strong, nullable) NSNumber *maxHeight;
@property (nonatomic, strong, nullable) NSNumber *contentHeight;
@property (nonatomic, strong, nullable) NSNumber *headerHeight;
@property (nonatomic, strong, nullable) UIColor *backgroundColor;
@property (nonatomic, strong, nullable) NSNumber *cornerRadius;
@property (nonatomic, assign) BOOL grabber;
@property (nonatomic, strong, nullable) NSDictionary *grabberOptions;
@property (nonatomic, assign) BOOL draggable;
@property (nonatomic, assign) BOOL dimmed;
@property (nonatomic, strong, nullable) NSNumber *dimmedDetentIndex;
@property (nonatomic, copy, nullable) NSString *blurTint;
@property (nonatomic, strong, nullable) NSNumber *blurIntensity;
@property (nonatomic, assign) BOOL blurInteraction;
@property (nonatomic, assign) BOOL pageSizing;
@property (nonatomic, copy, nullable) NSString *insetAdjustment;
@property (nonatomic, assign) BOOL isPresented;
@property (nonatomic, assign) NSInteger activeDetentIndex;

- (void)applyActiveDetent;
- (void)setupActiveDetentWithIndex:(NSInteger)index;
- (void)resizeToDetentIndex:(NSInteger)index;
- (void)setupSheetProps;
- (void)setupSheetDetents;
- (void)setupSheetDetentsForSizeChange;
- (void)setupDraggable;

@end

NS_ASSUME_NONNULL_END
