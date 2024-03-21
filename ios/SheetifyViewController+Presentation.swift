//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

extension SheetifyViewController {
  /// Prepares the view controller for sheet presentation
  /// Do nothing on IOS 14 and below... sad
  func preparePresentation(for view: UIView) {
    guard #available(iOS 15.0, *), let sheet = sheetPresentationController else {
      return
    }

    if #available(iOS 16.0, *) {
      sheet.detents = [
        .custom(identifier: .auto) { context in
          let value = min(view.bounds.height, 0.5 * context.maximumDetentValue)
          self.detentSize.auto = value

          return value
        },
        .custom(identifier: .medium) { context in
          let value = UISheetPresentationController.Detent.medium().resolvedValue(in: context)
          self.detentSize.medium = value ?? 0.5 * context.maximumDetentValue
          return value
        },
        .custom(identifier: .large) { context in
          let value = UISheetPresentationController.Detent.large().resolvedValue(in: context)
          self.detentSize.large = value ?? context.maximumDetentValue

          return value
        },
      ]
    } else {
      sheet.detents = [
        .medium(),
        .large(),
      ]

      detentSize.auto = 0.5 * maximumHeight
      detentSize.medium = 0.5 * maximumHeight
      detentSize.large = maximumHeight
    }

    sheet.prefersGrabberVisible = true
    sheet.prefersEdgeAttachedInCompactHeight = true
    sheet.prefersScrollingExpandsWhenScrolledToEdge = false

    sheet.delegate = self
  }
}
