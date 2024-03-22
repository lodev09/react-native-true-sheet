//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

/// Get the custom detent based on the given size and view frame size
@available(iOS 15.0, *)
func detent(for size: Any, with height: CGFloat) -> UISheetPresentationController.Detent? {
  if let floatSize = size as? CGFloat {
    if #available(iOS 16.0, *) {
      return UISheetPresentationController.Detent.custom { context in
        min(floatSize, context.maximumDetentValue)
      }
    }
  }

  if var stringSize = size as? String {
    if stringSize == "medium" { return UISheetPresentationController.Detent.medium() }
    if stringSize == "large" { return UISheetPresentationController.Detent.large() }

    if #available(iOS 16.0, *) {
      // Auto
      if stringSize == "auto" {
        return UISheetPresentationController.Detent.custom { context in
          min(height, context.maximumDetentValue)
        }
      }

      // Percent
      stringSize.removeAll(where: { $0 == "%" })
      let floatSize = CGFloat((stringSize as NSString).floatValue)
      if floatSize > 0.0 {
        return UISheetPresentationController.Detent.custom { context in
          min((floatSize / 100) * context.maximumDetentValue, context.maximumDetentValue)
        }
      }
    }
  }

  return nil
}
