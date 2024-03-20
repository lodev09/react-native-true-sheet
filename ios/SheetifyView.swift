/*
 *
 * Created by Jovanni Lo (@lodev09)
 * Copyright 2024-present
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

class SheetifyView: UIView {
  var controller: SheetifyViewController

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
    // Add main content as subview of the view controller
    controller.view.addSubview(subview)

    // TODO: Background color
    controller.view.backgroundColor = UIColor.white

    // If content is a scrollview, add constraints to fix weirdness
    // For some reason, sheet resizes scrollviews when collapsed 🤔
    if subview is RCTScrollView {
      let rctScrollView = subview as? RCTScrollView
      let scrollView = rctScrollView?.scrollView
      scrollView?.pinTo(view: controller.view)
    }

    if let rvc = reactViewController() {
      rvc.addChild(controller)
      controller.didMove(toParent: rvc)
    }
  }

  // MARK: - Methods

  func present(promise: Promise) {
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
