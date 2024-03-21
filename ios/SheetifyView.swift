//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

extension UIScrollView {
  func setInset(top: CGFloat) {
    let insetChange = top - contentInset.top

    contentInset.top = top
    verticalScrollIndicatorInsets.top = top

    // Adjust offset y to update scrolled offset
    contentOffset = CGPoint(x: contentOffset.x, y: contentOffset.y - insetChange)
  }

  func setInset(bottom: CGFloat) {
    contentInset.bottom = bottom
    verticalScrollIndicatorInsets.bottom = bottom
  }
}

// MARK: - SheetifyView

@objc(SheetifyView)
class SheetifyView: UIView {
  // MARK: - React properties

  @objc var sizes: NSArray = []

  // MARK: - Private properties

  private var bridge: RCTBridge
  private var touchHandler: RCTTouchHandler
  private var viewController: SheetifyViewController

  // MARK: - Setup properties

  private var contentView: UIView?
  private var contentHeight: CGFloat {
    var height: CGFloat = 0

    if let contentHeight = contentView?.frame.height { height += contentHeight }

    // Exclude bottom safe area for consistency with a Scrollable content
    let window = UIApplication.shared.windows.first(where: { $0.isKeyWindow })
    let bottomInset = window?.safeAreaInsets.bottom ?? 0

    return height - bottomInset
  }

  // MARK: - Content properties

  private var headerView: UIView?
  private var footerView: UIView?
  private var rctScrollView: RCTScrollView?

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
    guard contentView == nil else {
      Logger.error("Sheetify can only have one content view.")
      return
    }

    viewController.view.insertSubview(subview, at: 0)
    viewController.view.backgroundColor = backgroundColor ?? .white
    backgroundColor = .clear

    contentView = subview

    touchHandler.attach(to: subview)
  }

  override func removeReactSubview(_ subview: UIView!) {
    guard subview == contentView else {
      Logger.error("Cannot remove view other than sheet view")
      return
    }

    super.removeReactSubview(subview)

    touchHandler.detach(from: subview)
    contentView = nil
  }

  override func layoutSubviews() {
    super.layoutSubviews()

    guard let contentView else { return }

    contentView.pinTo(view: viewController.view)

    // Add constraints to fix weirdness to support ScrollView
    if let rctScrollView {
      rctScrollView.pinTo(view: contentView)
    }

    // Pin header at the top
    if let headerView {
      contentView.bringSubviewToFront(headerView)
      headerView.pinTo(
        view: viewController.view,
        from: [.top, .left, .right], with: headerView.frame.height
      )

      // Adjust top inset
      if let scrollView = rctScrollView?.scrollView {
        scrollView.setInset(top: headerView.frame.height)
      }
    }

    // Pin footer at the bottom
    if let footerView {
      contentView.bringSubviewToFront(footerView)
      footerView.pinTo(
        view: viewController.view,
        from: [.bottom, .left, .right],
        with: footerView.frame.height
      )

      // Adjust bottom inset
      if let scrollView = rctScrollView?.scrollView {
        scrollView.setInset(bottom: footerView.frame.height)
      }
    }
  }

  // MARK: - Methods

  func setContentWidth(_ width: CGFloat) {
    guard let contentView else { return }

    let size = CGSize(width: width, height: contentView.bounds.height)
    bridge.uiManager.setSize(size, for: contentView)
  }

  func handleScrollable(_ tag: NSNumber) {
    guard let view = bridge.uiManager.view(forReactTag: tag), view is RCTScrollView else {
      return
    }

    rctScrollView = view as? RCTScrollView
  }

  func handleHeader(_ tag: NSNumber) {
    guard let view = bridge.uiManager.view(forReactTag: tag) else {
      return
    }

    view.backgroundColor = .clear
    headerView = view
  }

  func handleFooter(_ tag: NSNumber) {
    guard let view = bridge.uiManager.view(forReactTag: tag) else {
      return
    }

    view.backgroundColor = .clear
    footerView = view
  }

  func present(promise: Promise) {
    let rvc = reactViewController()

    guard let rvc else {
      Logger.warning("No content view or react view controller present.")
      promise.resolve(false)
      return
    }

    viewController.preparePresentation(for: sizes, with: contentHeight)
    rvc.present(viewController, animated: true) {
      promise.resolve(true)
    }
  }
}
