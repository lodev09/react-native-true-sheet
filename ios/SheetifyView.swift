/*
 *
 * Created by Jovanni Lo (@lodev09)
 * Copyright 2024-present
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@objc(SheetifyView)
class SheetifyView: UIView {
  var controller: SheetifyViewController

  init(_ uiManager: RCTUIManager) {
    controller = SheetifyViewController(uiManager)
    super.init(frame: CGRect.zero)
  }

  @available(*, unavailable)
  required init?(coder _: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func insertReactSubview(_ subview: UIView!, at _: Int) {
    // Add content as subview of the controller view
    controller.view.addSubview(subview)

    // TODO: Background color
    controller.view.backgroundColor = backgroundColor
  }
}
