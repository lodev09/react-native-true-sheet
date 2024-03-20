//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

struct DetentSize {
  var large: CGFloat = 0
  var medium: CGFloat = 0
  var auto: CGFloat = 0

  @available(iOS 15.0, *)
  func size(for identifier: UISheetPresentationController.Detent.Identifier) -> CGFloat {
    switch identifier {
    case .large:
      return large
    case .medium:
      return medium
    case .auto:
      return auto
    default:
      return 0
    }
  }
}
