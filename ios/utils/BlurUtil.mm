//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "BlurUtil.h"

@implementation BlurUtil

+ (UIBlurEffectStyle)blurEffectStyleFromString:(NSString *)tintString {
  static NSDictionary<NSString *, NSNumber *> *styleMap = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    styleMap = @{
      @"dark" : @(UIBlurEffectStyleDark),
      @"light" : @(UIBlurEffectStyleLight),
      @"extra-light" : @(UIBlurEffectStyleExtraLight),
      @"regular" : @(UIBlurEffectStyleRegular),
      @"prominent" : @(UIBlurEffectStyleProminent),
      @"system-ultra-thin-material" : @(UIBlurEffectStyleSystemUltraThinMaterial),
      @"system-thin-material" : @(UIBlurEffectStyleSystemThinMaterial),
      @"system-material" : @(UIBlurEffectStyleSystemMaterial),
      @"system-thick-material" : @(UIBlurEffectStyleSystemThickMaterial),
      @"system-chrome-material" : @(UIBlurEffectStyleSystemChromeMaterial),
      @"system-ultra-thin-material-light" : @(UIBlurEffectStyleSystemUltraThinMaterialLight),
      @"system-thin-material-light" : @(UIBlurEffectStyleSystemThinMaterialLight),
      @"system-material-light" : @(UIBlurEffectStyleSystemMaterialLight),
      @"system-thick-material-light" : @(UIBlurEffectStyleSystemThickMaterialLight),
      @"system-chrome-material-light" : @(UIBlurEffectStyleSystemChromeMaterialLight),
      @"system-ultra-thin-material-dark" : @(UIBlurEffectStyleSystemUltraThinMaterialDark),
      @"system-thin-material-dark" : @(UIBlurEffectStyleSystemThinMaterialDark),
      @"system-material-dark" : @(UIBlurEffectStyleSystemMaterialDark),
      @"system-thick-material-dark" : @(UIBlurEffectStyleSystemThickMaterialDark),
      @"system-chrome-material-dark" : @(UIBlurEffectStyleSystemChromeMaterialDark),
    };
  });

  NSNumber *style = styleMap[tintString];
  if (style) {
    return (UIBlurEffectStyle)[style integerValue];
  }

  return UIBlurEffectStyleLight;
}

@end

#endif
