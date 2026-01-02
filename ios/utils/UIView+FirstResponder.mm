//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "UIView+FirstResponder.h"

@implementation UIView (FirstResponder)

- (UIView *)findFirstResponder {
  if (self.isFirstResponder) {
    return self;
  }
  for (UIView *subview in self.subviews) {
    UIView *firstResponder = [subview findFirstResponder];
    if (firstResponder) {
      return firstResponder;
    }
  }
  return nil;
}

@end
