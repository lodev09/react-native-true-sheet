//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

class SheetifyView: UIView {
  var controller: SheetifyViewController
  var viewManager: SheetifyViewManager

  // MARK: - Setup

  init(viewManager: SheetifyViewManager) {
    controller = SheetifyViewController()
    self.viewManager = viewManager

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

  func present(promise: Promise) {
    controller.prepareForPresentation()
    let contentView = controller.contentView

    // If content is a scrollview, add constraints to fix weirdness
    // For some reason, sheet resizes scrollviews when collapsed 🤔
    // Look for our `<SheetifyScrollView />` and handle constraints
    if let view = contentView.subviews.first(where: { viewManager.scrollTags.contains($0.reactTag) }) {
      if view.isRCTScrollView {
        view.pinTo(
          view: controller.view,
          with: contentView.reactPaddingInsets
        )
      }
    }

    guard let rvc = reactViewController() else {
      promise.resolve(false)
      return
    }

    rvc.present(controller, animated: true) {
      promise.resolve(true)
    }
  }
}
