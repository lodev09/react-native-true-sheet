//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

class SheetifyView: UIView {
  var controller: SheetifyViewController
  var scrollView: RCTScrollView?

  // MARK: - Setup

  init() {
    controller = SheetifyViewController()
    super.init(frame: CGRect.zero)
  }

  @available(*, unavailable)
  required init?(coder _: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func insertReactSubview(_ subview: UIView!, at _: Int) {
    controller.setupContent(with: subview)

    if let rvc = reactViewController() {
      rvc.addChild(controller)
      controller.didMove(toParent: rvc)
    }
  }

  // MARK: - Methods

  /// Add constraints to fix weirdness to an `RCTScrollView` component
  func handleScrollable(_ view: UIView) {
    guard view is RCTScrollView else { return }
    scrollView = view as? RCTScrollView
  }

  func present(promise: Promise) {
    if let rctScrollView = scrollView {
      let contentView = controller.contentView

      contentView.pinTo(view: controller.view)
      rctScrollView.pinTo(view: contentView)
    }

    guard let rvc = reactViewController() else {
      promise.resolve(false)
      return
    }

    controller.prepareForPresentation()
    rvc.present(controller, animated: true) {
      promise.resolve(true)
    }
  }
}
