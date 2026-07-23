//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "TrueSheetNavContentViewController.h"

@implementation TrueSheetNavContentViewController

- (instancetype)init {
  if (self = [super initWithNibName:nil bundle:nil]) {
    // Lay the view out below the bar — content never underlaps, so Yoga sizing
    // stays correct without inset gymnastics
    self.edgesForExtendedLayout = UIRectEdgeNone;
  }
  return self;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  self.view.backgroundColor = [UIColor clearColor];
}

- (void)viewDidLayoutSubviews {
  [super viewDidLayoutSubviews];

  if (self.onLayoutSubviews) {
    self.onLayoutSubviews(self.view.bounds.size);
  }
}

@end
