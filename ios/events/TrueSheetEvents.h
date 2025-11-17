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

/**
 * Centralized event emission for TrueSheet component.
 * Provides static methods for each event type to reduce code redundancy.
 */
@interface TrueSheetEvents : NSObject

/**
 * Emit onMount event.
 */
+ (void)emitOnMount:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter;

/**
 * Emit onWillPresent event.
 */
+ (void)emitOnWillPresent:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter;

/**
 * Emit onDidPresent event with DetentInfo.
 */
+ (void)emitOnDidPresent:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter
                   index:(NSInteger)index
                   value:(CGFloat)value
                position:(CGFloat)position;

/**
 * Emit onDismiss event.
 */
+ (void)emitOnDismiss:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter;

/**
 * Emit onDetentChange event with DetentInfo.
 */
+ (void)emitOnDetentChange:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter
                     index:(NSInteger)index
                     value:(CGFloat)value
                  position:(CGFloat)position;

/**
 * Emit onDragBegin event with DetentInfo.
 */
+ (void)emitOnDragBegin:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter
                  index:(NSInteger)index
                  value:(CGFloat)value
               position:(CGFloat)position;

/**
 * Emit onDragChange event with DetentInfo.
 */
+ (void)emitOnDragChange:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter
                   index:(NSInteger)index
                   value:(CGFloat)value
                position:(CGFloat)position;

/**
 * Emit onDragEnd event with DetentInfo.
 */
+ (void)emitOnDragEnd:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter
                index:(NSInteger)index
                value:(CGFloat)value
             position:(CGFloat)position;

/**
 * Emit onPositionChange event with DetentInfo.
 */
+ (void)emitOnPositionChange:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter
                       index:(NSInteger)index
                       value:(CGFloat)value
                    position:(CGFloat)position;

@end

NS_ASSUME_NONNULL_END

#endif  // RCT_NEW_ARCH_ENABLED