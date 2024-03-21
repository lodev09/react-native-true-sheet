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
  func preparePresentation(for contentView: UIView, with sizes: NSArray) {
    guard #available(iOS 15.0, *), let sheet = sheetPresentationController else {
      return
    }

    var detents: [UISheetPresentationController.Detent] = []
    for size in sizes {
      if let detent = detent(for: size, with: contentView.bounds) {
        detents.append(detent)
      }
    }

    // Default to [.medium, .large]
    if detents.isEmpty {
      detents = [.medium(), .large()]
    }

    sheet.detents = detents
    sheet.prefersGrabberVisible = true
    sheet.prefersEdgeAttachedInCompactHeight = true
    // sheet.prefersScrollingExpandsWhenScrolledToEdge = false

    sheet.delegate = self
  }
}
