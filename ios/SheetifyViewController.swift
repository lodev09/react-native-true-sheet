/*
 *
 * Created by Jovanni Lo (@lodev09)
 * Copyright 2024-present
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

class SheetifyViewController: UIViewController {
  // MARK: - Properties

  private var uiManager: RCTUIManager
  private var contentTag: NSNumber!

  // MARK: - Setup

  init(_ uiManager: RCTUIManager) {
    self.uiManager = uiManager
    super.init(nibName: nil, bundle: nil)
  }

  @available(*, unavailable)
  required init?(coder _: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  // MARK: - Methods

  /// Prepares the view controller for sheet presentation
  /// On IOS 14 and below, just present it modally... sad
  func prepareForPresentation() {
    let content = view.subviews[0]

    if #available(iOS 15.0, *) {
      if let sheet = sheetPresentationController {
        sheet.detents = [
          .medium(),
          .large(),
        ]

        if #available(iOS 16.0, *) {
          sheet.detents.append(.custom { context in
            min(content.bounds.height, 0.5 * context.maximumDetentValue)
          })
        }

        sheet.prefersGrabberVisible = true
        sheet.prefersEdgeAttachedInCompactHeight = true
      }
    }

    // Adjust the main content height based on the modal's available height
    let tag = content.reactTag
    let topInset = UIApplication.shared.windows.first?.safeAreaInsets.top ?? 0
    let availableHeight = view.bounds.height - topInset

    RCTExecuteOnUIManagerQueue {
      let shadowView = self.uiManager.shadowView(forReactTag: tag)
      if let node = shadowView?.yogaNode {
        YGNodeStyleSetHeight(node, Float(availableHeight))
      }
    }
  }
}
