//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

// MARK: - SizeInfo

struct SizeInfo {
  var index: Int
  var value: CGFloat
}

// MARK: - TrueSheetViewControllerDelegate

protocol TrueSheetViewControllerDelegate: AnyObject {
  func viewControllerDidChangeWidth(_ width: CGFloat)
  func viewControllerDidDismiss()
  func viewControllerSheetDidChangeSize(_ value: CGFloat, at index: Int)
  func viewControllerDidAppear()
}

// MARK: - TrueSheetViewController

class TrueSheetViewController: UIViewController, UISheetPresentationControllerDelegate {
  // MARK: - Properties

  weak var delegate: TrueSheetViewControllerDelegate?

  var lastViewWidth: CGFloat = 0
  var detentValues: [String: SizeInfo] = [:]

  @available(iOS 15.0, *)
  var sheet: UISheetPresentationController? {
    return sheetPresentationController
  }

  // MARK: - Setup

  @available(iOS 15.0, *)
  func sheetPresentationControllerDidChangeSelectedDetentIdentifier(_ sheet: UISheetPresentationController) {
    if let identifer = sheet.selectedDetentIdentifier,
       let size = detentValues[identifer.rawValue] {
      delegate?.viewControllerSheetDidChangeSize(size.value, at: size.index)
    }
  }

  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    delegate?.viewControllerDidAppear()
  }

  override func viewDidDisappear(_ animated: Bool) {
    super.viewDidDisappear(animated)
    delegate?.viewControllerDidDismiss()
  }

  /// This is called multiple times while sheet is being dragged.
  /// let's try to minimize size update by comparing last known width
  override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()

    if lastViewWidth != view.frame.width {
      delegate?.viewControllerDidChangeWidth(view.bounds.width)
      lastViewWidth = view.frame.width
    }
  }

  /// Prepares the view controller for sheet presentation
  /// Do nothing on IOS 14 and below... sad
  @available(iOS 15.0, *)
  func configureSheet(for sizes: [Any], at index: Int = 0, with height: CGFloat, _ completion: (() -> Void)?) {
    guard let sheet else { return }

    detentValues = [:]

    var detents: [UISheetPresentationController.Detent] = []

    for (index, size) in sizes.enumerated() {
      let detent = detentFor(size, with: height) { id, value in
        self.detentValues[id] = SizeInfo(index: index, value: value)
      }

      detents.append(detent)
    }

    sheet.detents = detents
    sheet.prefersGrabberVisible = true
    sheet.prefersEdgeAttachedInCompactHeight = true
    // sheet.prefersScrollingExpandsWhenScrolledToEdge = false

    sheet.delegate = self

    var identifier: UISheetPresentationController.Detent.Identifier = .medium

    if sheet.detents.indices.contains(index) {
      let detent = sheet.detents[index]
      if #available(iOS 16.0, *) {
        identifier = detent.identifier
      } else if detent == .large() {
        identifier = .large
      }
    }

    sheet.animateChanges {
      sheet.selectedDetentIdentifier = identifier
      completion?()
    }
  }
}
