//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "TrueSheetLifecycleEvents.h"

@implementation TrueSheetLifecycleEvents

+ (void)emitMount:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter {
  if (!eventEmitter)
    return;

  auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(eventEmitter);
  emitter->onMount({});
}

+ (void)emitWillPresent:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter
                  index:(NSInteger)index
               position:(CGFloat)position
                 detent:(CGFloat)detent {
  if (!eventEmitter)
    return;

  auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(eventEmitter);
  TrueSheetViewEventEmitter::OnWillPresent event;
  event.index = static_cast<int>(index);
  event.position = static_cast<double>(position);
  event.detent = static_cast<double>(detent);
  emitter->onWillPresent(event);
}

+ (void)emitDidPresent:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter
                 index:(NSInteger)index
              position:(CGFloat)position
                detent:(CGFloat)detent {
  if (!eventEmitter)
    return;

  auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(eventEmitter);
  TrueSheetViewEventEmitter::OnDidPresent event;
  event.index = static_cast<int>(index);
  event.position = static_cast<double>(position);
  event.detent = static_cast<double>(detent);
  emitter->onDidPresent(event);
}

+ (void)emitWillDismiss:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter {
  if (!eventEmitter)
    return;

  auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(eventEmitter);
  emitter->onWillDismiss({});
}

+ (void)emitDidDismiss:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter {
  if (!eventEmitter)
    return;

  auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(eventEmitter);
  emitter->onDidDismiss({});
}

@end

#endif  // RCT_NEW_ARCH_ENABLED
