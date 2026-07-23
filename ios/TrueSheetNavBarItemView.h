//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>

NS_ASSUME_NONNULL_BEGIN

@class TrueSheetNavBarItemView;

@protocol TrueSheetNavBarItemViewDelegate <NSObject>
@optional
- (void)navBarItemViewDidChangeSize:(TrueSheetNavBarItemView *)itemView;
@end

/**
 * Hosts React children for a nav bar slot. Re-parented into the navigation
 * bar as a bar button custom view or title view — UIKit owns its position,
 * while Yoga drives its size (reported via intrinsicContentSize).
 */
@interface TrueSheetNavBarItemView : RCTViewComponentView

@property (nonatomic, weak, nullable) id<TrueSheetNavBarItemViewDelegate> delegate;
@property (nonatomic, readonly) facebook::react::TrueSheetNavBarItemViewSlotType slotType;
@property (nonatomic, readonly) CGSize contentSize;

@end

NS_ASSUME_NONNULL_END

#endif  // RCT_NEW_ARCH_ENABLED
