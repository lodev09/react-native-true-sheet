//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import <Foundation/Foundation.h>
#import <react/renderer/components/TrueSheetSpec/EventEmitters.h>

using namespace facebook::react;

NS_ASSUME_NONNULL_BEGIN

@interface OnDragBeginEvent : NSObject

+ (void)emit:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter
       index:(NSInteger)index
       value:(CGFloat)value
    position:(CGFloat)position;

@end

NS_ASSUME_NONNULL_END

#endif  // RCT_NEW_ARCH_ENABLED