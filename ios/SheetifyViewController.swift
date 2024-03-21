//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

// MARK: - SheetifyViewController

class SheetifyViewController: UIViewController, UISheetPresentationControllerDelegate {
  // MARK: - Properties

  var lastViewWidth: CGFloat = 0

  /// Notify bound rect changes so we can adjust our sheetify view
  var widthDidChange: ((CGFloat) -> Void)?

  var maximumHeight: CGFloat {
    // Use view height to determine detent sizes
    let topInset = UIApplication.shared.windows.first?.safeAreaInsets.top ?? 0
    return view.bounds.height - topInset
  }

  // MARK: - Setup

  @available(iOS 15.0, *)
  func sheetPresentationControllerDidChangeSelectedDetentIdentifier(_: UISheetPresentationController) {
    // TODO: Change events
  }

  /// This is called multiple times while sheet is being dragged.
  /// let's try to minimize size update by comparing last known width
  override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()

    if let widthDidChange, lastViewWidth != view.frame.width {
      widthDidChange(view.bounds.width)
      lastViewWidth = view.frame.width
    }
  }

  /// Prepares the view controller for sheet presentation
  /// Do nothing on IOS 14 and below... sad
  func preparePresentation(for sizes: NSArray, with height: CGFloat) {
    guard #available(iOS 15.0, *), let sheet = sheetPresentationController else {
      return
    }

    var detents: [UISheetPresentationController.Detent] = []
    for size in sizes {
      if let detent = detent(for: size, with: height) {
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
