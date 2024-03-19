/*
 *
 * Created by Jovanni Lo (@lodev09)
 * Copyright 2024-present
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@objc(SheetifyView)
class SheetifyView : UIView {
  var controller: SheetifyViewController?

  override public init(frame: CGRect) {
    super.init(frame: frame)
    controller = SheetifyViewController()
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  override func insertReactSubview(_ subview: UIView!, at atIndex: Int) {
    // The main controller view is the 1st child of the sheet component
    controller?.view = subview
  }
}
