//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#pragma once

#ifdef RCT_NEW_ARCH_ENABLED

#import <React/RCTBridgeModule.h>
#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

// Completion block for async operations
typedef void (^TrueSheetCompletionBlock)(BOOL success, NSError *_Nullable error);

@interface TrueSheetView : RCTViewComponentView

// TurboModule methods
- (void)presentAtIndex:(NSInteger)index
              animated:(BOOL)animated
            completion:(nullable TrueSheetCompletionBlock)completion;

- (void)dismissAnimated:(BOOL)animated completion:(nullable TrueSheetCompletionBlock)completion;

// Event notification methods (called by container)
- (void)notifyWillPresent;
- (void)notifyDidPresent;
- (void)notifyDidDrag:(UIGestureRecognizerState)state index:(NSInteger)index position:(CGFloat)position;
- (void)notifyDidDismiss;
- (void)notifyDidChangeDetent:(NSInteger)index position:(CGFloat)position;
- (void)notifyDidChangePosition:(NSInteger)index position:(CGFloat)position;

@end

NS_ASSUME_NONNULL_END

#endif  // RCT_NEW_ARCH_ENABLED