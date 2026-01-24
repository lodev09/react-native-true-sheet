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

@class TrueSheetViewController;

NS_ASSUME_NONNULL_BEGIN

// Completion block for async operations
typedef void (^TrueSheetCompletionBlock)(BOOL success, NSError *_Nullable error);

@interface TrueSheetView : RCTViewComponentView

@property (nonatomic, readonly) TrueSheetViewController *viewController;

// TurboModule methods
- (void)presentAtIndex:(NSInteger)index
              animated:(BOOL)animated
            completion:(nullable TrueSheetCompletionBlock)completion;

- (void)dismissAnimated:(BOOL)animated completion:(nullable TrueSheetCompletionBlock)completion;

- (void)resizeToIndex:(NSInteger)index completion:(nullable TrueSheetCompletionBlock)completion;

- (void)dismissStackAnimated:(BOOL)animated completion:(nullable TrueSheetCompletionBlock)completion;

@end

NS_ASSUME_NONNULL_END

#endif  // RCT_NEW_ARCH_ENABLED
