//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

extension UIBlurEffect {
  convenience init(with style: String) {
    var blurStyle: Style

    switch style {
    case "default":
      blurStyle = .regular
    case "extraLight":
      blurStyle = .extraLight
    case "light":
      blurStyle = .light
    case "regular":
      blurStyle = .regular
    case "dark":
      blurStyle = .dark
    case "prominent":
      blurStyle = .prominent
    case "systemUltraThinMaterial":
      blurStyle = .systemUltraThinMaterial
    case "systemThinMaterial":
      blurStyle = .systemThinMaterial
    case "systemMaterial":
      blurStyle = .systemMaterial
    case "systemThickMaterial":
      blurStyle = .systemThickMaterial
    case "systemChromeMaterial":
      blurStyle = .systemChromeMaterial
    case "systemUltraThinMaterialLight":
      blurStyle = .systemUltraThinMaterialLight
    case "systemThickMaterialLight":
      blurStyle = .systemThickMaterialLight
    case "systemThinMaterialLight":
      blurStyle = .systemThinMaterialLight
    case "systemMaterialLight":
      blurStyle = .systemMaterialLight
    case "systemChromeMaterialLight":
      blurStyle = .systemChromeMaterialLight
    case "systemUltraThinMaterialDark":
      blurStyle = .systemUltraThinMaterialDark
    case "systemThinMaterialDark":
      blurStyle = .systemThinMaterialDark
    case "systemMaterialDark":
      blurStyle = .systemMaterialDark
    case "systemThickMaterialDark":
      blurStyle = .systemThickMaterialDark
    case "systemChromeMaterialDark":
      blurStyle = .systemChromeMaterialDark
    default:
      blurStyle = .light
    }

    self.init(style: blurStyle)
  }
}
