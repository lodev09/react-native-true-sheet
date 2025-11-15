//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#pragma once

#ifdef RCT_NEW_ARCH_ENABLED

#import <UIKit/UIKit.h>
#import <React/RCTViewComponentView.h>
#import <React/RCTBridgeModule.h>

@class TrueSheetViewController;

NS_ASSUME_NONNULL_BEGIN

// Completion block for async operations
typedef void (^TrueSheetCompletionBlock)(BOOL success, NSError * _Nullable error);

@interface TrueSheetViewComponentView : RCTViewComponentView

@property (nonatomic, strong, nullable) TrueSheetViewController *controller;

// Commands (fire-and-forget, for Commands API)
- (void)present:(NSInteger)index;
- (void)dismiss;

// Async methods (with callbacks, for TurboModule)
- (void)presentAtIndex:(NSInteger)index 
              animated:(BOOL)animated
            completion:(nullable TrueSheetCompletionBlock)completion;

- (void)dismissAnimated:(BOOL)animated 
             completion:(nullable TrueSheetCompletionBlock)completion;

@end

NS_ASSUME_NONNULL_END

#endif // RCT_NEW_ARCH_ENABLED