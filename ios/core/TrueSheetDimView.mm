//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "TrueSheetDimView.h"

@implementation TrueSheetDimView

#pragma mark - Initialization

- (instancetype)init {
  if (self = [super init]) {
    self.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    self.alpha = 0;

    UITapGestureRecognizer *tap = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleTap)];
    [self addGestureRecognizer:tap];
  }
  return self;
}

#pragma mark - Public

- (void)addToView:(UIView *)parentView {
  self.frame = parentView.bounds;
  [parentView insertSubview:self atIndex:0];
}

#pragma mark - Actions

- (void)handleTap {
  if (_onTap) {
    _onTap();
  }
}

@end
