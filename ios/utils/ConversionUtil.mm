//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "ConversionUtil.h"

@implementation ConversionUtil

+ (UIBlurEffectStyle)blurEffectStyleFromString:(NSString *)tintString {
  if ([tintString isEqualToString:@"dark"]) {
    return UIBlurEffectStyleDark;
  } else if ([tintString isEqualToString:@"light"]) {
    return UIBlurEffectStyleLight;
  } else if ([tintString isEqualToString:@"extra-light"]) {
    return UIBlurEffectStyleExtraLight;
  } else if ([tintString isEqualToString:@"regular"]) {
    return UIBlurEffectStyleRegular;
  } else if ([tintString isEqualToString:@"prominent"]) {
    return UIBlurEffectStyleProminent;
  } else if ([tintString isEqualToString:@"system-ultra-thin-material"]) {
    return UIBlurEffectStyleSystemUltraThinMaterial;
  } else if ([tintString isEqualToString:@"system-thin-material"]) {
    return UIBlurEffectStyleSystemThinMaterial;
  } else if ([tintString isEqualToString:@"system-material"]) {
    return UIBlurEffectStyleSystemMaterial;
  } else if ([tintString isEqualToString:@"system-thick-material"]) {
    return UIBlurEffectStyleSystemThickMaterial;
  } else if ([tintString isEqualToString:@"system-chrome-material"]) {
    return UIBlurEffectStyleSystemChromeMaterial;
  } else if ([tintString isEqualToString:@"system-ultra-thin-material-light"]) {
    return UIBlurEffectStyleSystemUltraThinMaterialLight;
  } else if ([tintString isEqualToString:@"system-thin-material-light"]) {
    return UIBlurEffectStyleSystemThinMaterialLight;
  } else if ([tintString isEqualToString:@"system-material-light"]) {
    return UIBlurEffectStyleSystemMaterialLight;
  } else if ([tintString isEqualToString:@"system-thick-material-light"]) {
    return UIBlurEffectStyleSystemThickMaterialLight;
  } else if ([tintString isEqualToString:@"system-chrome-material-light"]) {
    return UIBlurEffectStyleSystemChromeMaterialLight;
  } else if ([tintString isEqualToString:@"system-ultra-thin-material-dark"]) {
    return UIBlurEffectStyleSystemUltraThinMaterialDark;
  } else if ([tintString isEqualToString:@"system-thin-material-dark"]) {
    return UIBlurEffectStyleSystemThinMaterialDark;
  } else if ([tintString isEqualToString:@"system-material-dark"]) {
    return UIBlurEffectStyleSystemMaterialDark;
  } else if ([tintString isEqualToString:@"system-thick-material-dark"]) {
    return UIBlurEffectStyleSystemThickMaterialDark;
  } else if ([tintString isEqualToString:@"system-chrome-material-dark"]) {
    return UIBlurEffectStyleSystemChromeMaterialDark;
  }

  // Default to light if not recognized
  return UIBlurEffectStyleLight;
}

@end
