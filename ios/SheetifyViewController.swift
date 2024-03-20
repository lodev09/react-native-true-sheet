/*
 *
 * Created by Jovanni Lo (@lodev09)
 * Copyright 2024-present
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

class SheetifyViewController: UIViewController, UISheetPresentationControllerDelegate {
  // MARK: - Properties

  // [auto, medium, large]
  var detentSize: DetentSize

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

//  override func viewDidAppear(_ animated: Bool) {
//    super.viewDidAppear(animated)

  // Update content height on the first appearance
//    resizeScrollView(view.bounds.height)
//  }

//  func resizeScrollView(_ height: CGFloat) {
//    RCTExecuteOnUIManagerQueue {
//      let shadowView = self.uiManager.shadowView(forReactTag: contentView.reactTag)
//      if let node = shadowView?.yogaNode {
//        YGNodeStyleSetHeight(node, Float(height + 59))
//        self.uiManager.setNeedsLayout()
//      }
//    }
//  }
}
