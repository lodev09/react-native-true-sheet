//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

@available(iOS 15.0, *)
extension UISheetPresentationController.Detent.Identifier {
  static let auto = UISheetPresentationController.Detent.Identifier("auto")
}

// MARK: - SheetifyViewController

class SheetifyViewController: UIViewController, UISheetPresentationControllerDelegate {
  // MARK: - Properties

  var detentSize: DetentSize
  var lastViewWidth: CGFloat = 0

  /// Notify bound rect changes so we can adjust our sheetify view
  var widthDidChange: ((CGFloat) -> Void)?

  var maximumHeight: CGFloat {
    // Use view height to determine detent sizes
    let topInset = UIApplication.shared.windows.first?.safeAreaInsets.top ?? 0
    return view.bounds.height - topInset
  }

  // MARK: - Setup

  init() {
    detentSize = DetentSize()
    super.init(nibName: nil, bundle: nil)
  }

  @available(*, unavailable)
  required init?(coder _: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  @available(iOS 15.0, *)
  func sheetPresentationControllerDidChangeSelectedDetentIdentifier(_ sheet: UISheetPresentationController) {
    if let detent = sheet.selectedDetentIdentifier {
      // TODO: Change events
      let height = detentSize.size(for: detent)
      print("DETENT:", detent.rawValue, "HEIGHT:", height)
    }
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
}
