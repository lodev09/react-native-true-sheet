//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

class SheetifyView: UIView {
  var controller: SheetifyViewController?

  // MARK: - Setup

  init() {
    super.init(frame: CGRect.zero)
    controller = SheetifyViewController(target: self)
  }

  @available(*, unavailable)
  required init?(coder _: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func insertReactSubview(_ subview: UIView!, at _: Int) {
    controller?.setupContent(with: subview)
  }

  // MARK: - Methods

  func present(promise: Promise) {
    controller?.present(promise: promise)
  }
}
