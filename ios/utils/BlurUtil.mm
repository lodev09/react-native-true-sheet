//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "BlurUtil.h"

#import <react/renderer/components/TrueSheetSpec/Props.h>

using namespace facebook::react;

@implementation BlurUtil

+ (UIBlurEffectStyle)blurEffectStyleFromEnum:(NSInteger)blur {
  switch ((TrueSheetViewBackgroundBlur)blur) {
    case TrueSheetViewBackgroundBlur::Dark:
      return UIBlurEffectStyleDark;
    case TrueSheetViewBackgroundBlur::ExtraLight:
      return UIBlurEffectStyleExtraLight;
    case TrueSheetViewBackgroundBlur::Regular:
      return UIBlurEffectStyleRegular;
    case TrueSheetViewBackgroundBlur::Prominent:
      return UIBlurEffectStyleProminent;
    case TrueSheetViewBackgroundBlur::SystemUltraThinMaterial:
      return UIBlurEffectStyleSystemUltraThinMaterial;
    case TrueSheetViewBackgroundBlur::SystemThinMaterial:
      return UIBlurEffectStyleSystemThinMaterial;
    case TrueSheetViewBackgroundBlur::SystemMaterial:
      return UIBlurEffectStyleSystemMaterial;
    case TrueSheetViewBackgroundBlur::SystemThickMaterial:
      return UIBlurEffectStyleSystemThickMaterial;
    case TrueSheetViewBackgroundBlur::SystemChromeMaterial:
      return UIBlurEffectStyleSystemChromeMaterial;
    case TrueSheetViewBackgroundBlur::SystemUltraThinMaterialLight:
      return UIBlurEffectStyleSystemUltraThinMaterialLight;
    case TrueSheetViewBackgroundBlur::SystemThinMaterialLight:
      return UIBlurEffectStyleSystemThinMaterialLight;
    case TrueSheetViewBackgroundBlur::SystemMaterialLight:
      return UIBlurEffectStyleSystemMaterialLight;
    case TrueSheetViewBackgroundBlur::SystemThickMaterialLight:
      return UIBlurEffectStyleSystemThickMaterialLight;
    case TrueSheetViewBackgroundBlur::SystemChromeMaterialLight:
      return UIBlurEffectStyleSystemChromeMaterialLight;
    case TrueSheetViewBackgroundBlur::SystemUltraThinMaterialDark:
      return UIBlurEffectStyleSystemUltraThinMaterialDark;
    case TrueSheetViewBackgroundBlur::SystemThinMaterialDark:
      return UIBlurEffectStyleSystemThinMaterialDark;
    case TrueSheetViewBackgroundBlur::SystemMaterialDark:
      return UIBlurEffectStyleSystemMaterialDark;
    case TrueSheetViewBackgroundBlur::SystemThickMaterialDark:
      return UIBlurEffectStyleSystemThickMaterialDark;
    case TrueSheetViewBackgroundBlur::SystemChromeMaterialDark:
      return UIBlurEffectStyleSystemChromeMaterialDark;
    case TrueSheetViewBackgroundBlur::Default:
    case TrueSheetViewBackgroundBlur::Light:
    case TrueSheetViewBackgroundBlur::None:
    default:
      return UIBlurEffectStyleLight;
  }
}

@end

#endif
