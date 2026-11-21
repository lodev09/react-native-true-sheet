//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifndef StateUtil_h
#define StateUtil_h

#import <UIKit/UIKit.h>
#import <react/renderer/core/ConcreteState.h>

/**
 * Call before an immediate Fabric state update.
 *
 * An immediate update can also mount commits still pending on its surface.
 * Inside a UIKit animation (e.g. a detent resize), views those commits create
 * would animate in from a zero frame, so this makes a best-effort attempt to
 * mount them without animation first. Fabric can still defer that mount, e.g.
 * while another one is in flight.
 *
 * Returns YES when `view` kept its Fabric tag, NO when that mount recycled it;
 * skip the update then. Build the update's data after calling this, since the
 * mount can change it.
 */
template <typename ConcreteStateT>
inline BOOL TrueSheetPrepareImmediateStateUpdate(UIView *view, std::shared_ptr<const ConcreteStateT> state) {
  using Data = typename ConcreteStateT::Data;

  if ([UIView inheritedAnimationDuration] <= 0) {
    return YES;
  }

  NSInteger tag = view.tag;
  [UIView performWithoutAnimation:^{
    // Copies the state as of commit time, so it can't overwrite a newer one
    state->updateState([](const Data &current) { return std::make_shared<const Data>(current); },
      facebook::react::EventQueue::UpdateMode::unstable_Immediate);
  }];

  return view.tag == tag;
}

#endif /* StateUtil_h */
