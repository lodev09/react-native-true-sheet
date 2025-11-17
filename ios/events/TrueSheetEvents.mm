//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "TrueSheetEvents.h"
#import <react/renderer/components/TrueSheetSpec/EventEmitters.h>

@implementation TrueSheetEvents

+ (void)emitOnMount:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter {
  if (!eventEmitter) return;
  
  auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(eventEmitter);
  emitter->onMount({});
}

+ (void)emitOnWillPresent:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter {
  if (!eventEmitter) return;
  
  auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(eventEmitter);
  emitter->onWillPresent({});
}

+ (void)emitOnDidPresent:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter
                   index:(NSInteger)index
                   value:(CGFloat)value
                position:(CGFloat)position {
  if (!eventEmitter) return;
  
  auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(eventEmitter);
  TrueSheetViewEventEmitter::OnDidPresent event;
  event.index = static_cast<int>(index);
  event.value = static_cast<double>(value);
  event.position = static_cast<double>(position);
  emitter->onDidPresent(event);
}

+ (void)emitOnDismiss:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter {
  if (!eventEmitter) return;
  
  auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(eventEmitter);
  emitter->onDismiss({});
}

+ (void)emitOnDetentChange:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter
                     index:(NSInteger)index
                     value:(CGFloat)value
                  position:(CGFloat)position {
  if (!eventEmitter) return;
  
  auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(eventEmitter);
  TrueSheetViewEventEmitter::OnDetentChange event;
  event.index = static_cast<int>(index);
  event.value = static_cast<double>(value);
  event.position = static_cast<double>(position);
  emitter->onDetentChange(event);
}

+ (void)emitOnDragBegin:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter
                  index:(NSInteger)index
                  value:(CGFloat)value
               position:(CGFloat)position {
  if (!eventEmitter) return;
  
  auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(eventEmitter);
  TrueSheetViewEventEmitter::OnDragBegin event;
  event.index = static_cast<int>(index);
  event.value = static_cast<double>(value);
  event.position = static_cast<double>(position);
  emitter->onDragBegin(event);
}

+ (void)emitOnDragChange:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter
                   index:(NSInteger)index
                   value:(CGFloat)value
                position:(CGFloat)position {
  if (!eventEmitter) return;
  
  auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(eventEmitter);
  TrueSheetViewEventEmitter::OnDragChange event;
  event.index = static_cast<int>(index);
  event.value = static_cast<double>(value);
  event.position = static_cast<double>(position);
  emitter->onDragChange(event);
}

+ (void)emitOnDragEnd:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter
                index:(NSInteger)index
                value:(CGFloat)value
             position:(CGFloat)position {
  if (!eventEmitter) return;
  
  auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(eventEmitter);
  TrueSheetViewEventEmitter::OnDragEnd event;
  event.index = static_cast<int>(index);
  event.value = static_cast<double>(value);
  event.position = static_cast<double>(position);
  emitter->onDragEnd(event);
}

+ (void)emitOnPositionChange:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter
                       index:(NSInteger)index
                       value:(CGFloat)value
                    position:(CGFloat)position {
  if (!eventEmitter) return;
  
  auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(eventEmitter);
  TrueSheetViewEventEmitter::OnPositionChange event;
  event.index = static_cast<int>(index);
  event.value = static_cast<double>(value);
  event.position = static_cast<double>(position);
  emitter->onPositionChange(event);
}

@end

#endif  // RCT_NEW_ARCH_ENABLED