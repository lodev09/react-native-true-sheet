//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "OnSizeChangeEvent.h"

@implementation OnSizeChangeEvent

+ (void)emit:(std::shared_ptr<const facebook::react::EventEmitter>)eventEmitter
       width:(CGFloat)width
      height:(CGFloat)height {
  if (!eventEmitter)
    return;

  auto emitter = std::static_pointer_cast<TrueSheetViewEventEmitter const>(eventEmitter);
  TrueSheetViewEventEmitter::OnSizeChange event;
  event.width = static_cast<double>(width);
  event.height = static_cast<double>(height);
  emitter->onSizeChange(event);
}

@end

#endif  // RCT_NEW_ARCH_ENABLED
