//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import <React/RCTSurfaceTouchHandler.h>
#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>
#import "core/TrueSheetKeyboardObserver.h"

@class TrueSheetViewController;

NS_ASSUME_NONNULL_BEGIN

@interface TrueSheetFooterView : RCTViewComponentView <TrueSheetKeyboardObserverDelegate>

@property (nonatomic, weak, nullable) TrueSheetKeyboardObserver *keyboardObserver;

- (void)setupConstraintsWithHeight:(CGFloat)height;

@end

NS_ASSUME_NONNULL_END

#endif
