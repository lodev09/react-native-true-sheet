//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import <UIKit/UIKit.h>
#import <React/RCTComponent.h>
#import <React/RCTBridge.h>

@class TrueSheetViewController;

NS_ASSUME_NONNULL_BEGIN

@interface TrueSheetView : UIView

// MARK: - Events
@property (nonatomic, copy, nullable) RCTDirectEventBlock onMount;
@property (nonatomic, copy, nullable) RCTDirectEventBlock onDismiss;
@property (nonatomic, copy, nullable) RCTDirectEventBlock onPresent;
@property (nonatomic, copy, nullable) RCTDirectEventBlock onSizeChange;
@property (nonatomic, copy, nullable) RCTDirectEventBlock onContainerSizeChange;
@property (nonatomic, copy, nullable) RCTDirectEventBlock onDragBegin;
@property (nonatomic, copy, nullable) RCTDirectEventBlock onDragChange;
@property (nonatomic, copy, nullable) RCTDirectEventBlock onDragEnd;

// MARK: - Properties
@property (nonatomic, strong) NSNumber *initialIndex;
@property (nonatomic, assign) BOOL initialIndexAnimated;
@property (nonatomic, strong, nullable) NSNumber *scrollableHandle;
@property (nonatomic, strong, nullable) NSNumber *maxHeight;
@property (nonatomic, strong, nullable) NSArray *sizes;
@property (nonatomic, copy, nullable) NSString *blurTint;
@property (nonatomic, strong, nullable) NSNumber *background;
@property (nonatomic, strong, nullable) NSNumber *cornerRadius;
@property (nonatomic, assign) BOOL grabber;
@property (nonatomic, assign) BOOL dismissible;
@property (nonatomic, assign) BOOL dimmed;
@property (nonatomic, strong, nullable) NSNumber *dimmedIndex;
@property (nonatomic, strong, nullable) NSNumber *contentHeight;
@property (nonatomic, strong, nullable) NSNumber *footerHeight;

// MARK: - Initialization
- (instancetype)initWithBridge:(RCTBridge *)bridge;

// MARK: - Methods
- (void)presentAtIndex:(NSInteger)index resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)dismissWithResolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)invalidate;

@end

NS_ASSUME_NONNULL_END