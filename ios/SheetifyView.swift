//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

@objc(SheetifyView)
class SheetifyView: UIView {
  // MARK: - React properties

  @objc var sizes: NSArray = []

  // MARK: - Initial properties

  private var bridge: RCTBridge
  private var touchHandler: RCTTouchHandler
  private var viewController: SheetifyViewController

  // MARK: - Setup properties

  private var contentView: UIView?
  private var scrollView: RCTScrollView?

  // MARK: - Setup

  init(with bridge: RCTBridge) {
    self.bridge = bridge

    viewController = SheetifyViewController()
    touchHandler = RCTTouchHandler(bridge: bridge)

    super.init(frame: .zero)

    viewController.widthDidChange = { width in
      self.setContentWidth(width)
    }
  }

  @available(*, unavailable)
  required init?(coder _: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func insertReactSubview(_ subview: UIView!, at _: Int) {
    guard subview != nil, contentView == nil else {
      print("Sheetify can only have one subview.")
      return
    }

    // Add main content as subview of the view controller
    viewController.view.insertSubview(subview, at: 0)

    viewController.view.backgroundColor = backgroundColor ?? .white
    backgroundColor = .clear

    touchHandler.attach(to: subview)
    contentView = subview
  }

  override func removeReactSubview(_ subview: UIView!) {
    guard subview == contentView else {
      print("Cannot remove view other than modal view")
      return
    }

    super.removeReactSubview(subview)

    touchHandler.detach(from: subview)
    contentView = nil
  }

  func setContentWidth(_ width: CGFloat) {
    if let contentView {
      let size = CGSize(width: width, height: contentView.bounds.height)
      bridge.uiManager.setSize(size, for: contentView)

      // Add constraits to our content and scrollView
      if let scrollView {
        contentView.pinTo(view: viewController.view)
        scrollView.pinTo(view: contentView)
      }
    }
  }

  // MARK: - Methods

  /// Add constraints to fix weirdness to an `RCTScrollView` component
  func handleScrollable(_ view: UIView) {
    guard view is RCTScrollView else { return }
    scrollView = view as? RCTScrollView
  }

  func present(promise: Promise) {
    let rvc = reactViewController()

    guard let contentView, let rvc else {
      print("No content view or react view controller present.")
      promise.resolve(false)
      return
    }

    viewController.preparePresentation(for: contentView, with: sizes)
    rvc.present(viewController, animated: true) {
      promise.resolve(true)
    }
  }
}
