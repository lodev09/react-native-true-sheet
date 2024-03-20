//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

extension UIView {
  var isRCTScrollView: Bool {
    guard self is RCTScrollView, let rctScrollView = self as? RCTScrollView else {
      return false
    }

    return true
  }
}
