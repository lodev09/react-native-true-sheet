//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import <UIKit/UIKit.h>

@class TrueSheetViewController;

NS_ASSUME_NONNULL_BEGIN

@protocol TrueSheetKeyboardObserverDelegate <NSObject>

- (void)keyboardWillShow:(CGFloat)height duration:(NSTimeInterval)duration curve:(UIViewAnimationOptions)curve;
- (void)keyboardWillHide:(NSTimeInterval)duration curve:(UIViewAnimationOptions)curve;

@end

@interface TrueSheetKeyboardObserver : NSObject

@property (nonatomic, weak, nullable) TrueSheetViewController *viewController;

- (void)addDelegate:(id<TrueSheetKeyboardObserverDelegate>)delegate;
- (void)removeDelegate:(id<TrueSheetKeyboardObserverDelegate>)delegate;

- (void)start;
- (void)stop;

@end

NS_ASSUME_NONNULL_END

#endif
