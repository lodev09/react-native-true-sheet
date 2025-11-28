//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "TrueSheetStateEvents.h"

@implementation TrueSheetStateEvents

+ (void)emitDetentChange:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter
                   index:(NSInteger)index
                position:(CGFloat)position
                  detent:(CGFloat)detent {
  if (!eventEmitter)
    return;

  auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(eventEmitter);
  TrueSheetViewEventEmitter::OnDetentChange event;
  event.index = static_cast<int>(index);
  event.position = static_cast<double>(position);
  event.detent = static_cast<double>(detent);
  emitter->onDetentChange(event);
}

+ (void)emitPositionChange:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter
                     index:(CGFloat)index
                  position:(CGFloat)position
                    detent:(CGFloat)detent
             transitioning:(BOOL)transitioning {
  if (!eventEmitter)
    return;

  auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(eventEmitter);
  TrueSheetViewEventEmitter::OnPositionChange event;
  event.index = static_cast<double>(index);
  event.position = static_cast<double>(position);
  event.detent = static_cast<double>(detent);
  event.transitioning = static_cast<bool>(transitioning);
  emitter->onPositionChange(event);
}

@end

#endif  // RCT_NEW_ARCH_ENABLED
