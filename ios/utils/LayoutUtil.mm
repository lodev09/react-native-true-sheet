//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "LayoutUtil.h"

@implementation LayoutUtil

+ (void)pinView:(UIView *)view toParentView:(UIView *)parentView edges:(UIRectEdge)edges {
  [self pinView:view toParentView:parentView edges:edges height:0];
}

+ (void)pinView:(UIView *)view toParentView:(UIView *)parentView edges:(UIRectEdge)edges height:(CGFloat)height {
  view.translatesAutoresizingMaskIntoConstraints = NO;

  if (edges & UIRectEdgeTop) {
    [view.topAnchor constraintEqualToAnchor:parentView.topAnchor].active = YES;
  }
  if (edges & UIRectEdgeBottom) {
    [view.bottomAnchor constraintEqualToAnchor:parentView.bottomAnchor].active = YES;
  }
  if (edges & UIRectEdgeLeft) {
    [view.leadingAnchor constraintEqualToAnchor:parentView.leadingAnchor].active = YES;
  }
  if (edges & UIRectEdgeRight) {
    [view.trailingAnchor constraintEqualToAnchor:parentView.trailingAnchor].active = YES;
  }

  // Apply height constraint if provided
  if (height > 0) {
    [view.heightAnchor constraintEqualToConstant:height].active = YES;
  }
}

+ (void)unpinView:(UIView *)view {
  if (!view)
    return;
  view.translatesAutoresizingMaskIntoConstraints = YES;
  [view removeConstraints:view.constraints];
}

@end

#endif