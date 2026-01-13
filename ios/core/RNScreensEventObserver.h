//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import <UIKit/UIKit.h>
#import <react/renderer/components/TrueSheetSpec/TrueSheetViewState.h>

NS_ASSUME_NONNULL_BEGIN

@class TrueSheetView;

@protocol RNScreensEventObserverDelegate <NSObject>

- (void)presenterScreenWillDisappear;
- (void)presenterScreenWillAppear;

@end

/**
 * Observes react-native-screens lifecycle events via C++ EventDispatcher.
 * Detects when the presenting screen unmounts while sheet is presented.
 */
@interface RNScreensEventObserver : NSObject

@property (nonatomic, weak) TrueSheetView<RNScreensEventObserverDelegate> *delegate;

- (void)startObservingWithState:(const facebook::react::TrueSheetViewState &)state;
- (void)stopObserving;

- (void)capturePresenterScreenFromView:(UIView *)view;
- (BOOL)shouldDismissForScreenTag:(NSInteger)screenTag;

@end

NS_ASSUME_NONNULL_END

#endif  // RCT_NEW_ARCH_ENABLED
