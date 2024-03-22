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

  // MARK: - Private properties

  private var bridge: RCTBridge
  private var touchHandler: RCTTouchHandler
  private var viewController: SheetifyViewController

  // MARK: - Content properties

  private var contentView: UIView?
  private var rctScrollView: RCTScrollView?
  private var footerView: UIView?

  private var bottomInset: CGFloat {
    let window = UIApplication.shared.windows.first(where: { $0.isKeyWindow })
    return window?.safeAreaInsets.bottom ?? 0
  }

  // Content height minus the footer height for `auto` layout
  private var contentHeight: CGFloat {
    guard let contentView else { return 0 }

    // Exclude bottom safe area for consistency with a Scrollable content
    return contentView.frame.height - bottomInset
  }

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

    // Add constraints to fix weirdness and support ScrollView
    if let rctScrollView {
      contentView.pinTo(view: viewController.view)
      rctScrollView.superview?.pinTo(view: contentView)
      rctScrollView.pinTo(view: rctScrollView.superview!)
    }

    // Pin footer at the bottom
    if let footerView {
      contentView.bringSubviewToFront(footerView)
      footerView.pinTo(
        view: viewController.view,
        from: [.bottom, .left, .right],
        with: footerView.frame.height
      )

      if let scrollView = rctScrollView?.scrollView {
        scrollView.contentInset.bottom = footerView.frame.height
        scrollView.verticalScrollIndicatorInsets.bottom = footerView.frame.height - bottomInset
      }
    }
  }

  // MARK: - Prop setters

  @objc
  func setScrollableHandle(_ tag: NSNumber?) {
    guard let view = bridge.uiManager.view(forReactTag: tag), view is RCTScrollView else {
      rctScrollView = nil
      return
    }

    rctScrollView = view as? RCTScrollView
  }

  @objc
  func setFooterHandle(_ tag: NSNumber?) {
    guard let view = bridge.uiManager.view(forReactTag: tag) else {
      footerView = nil
      return
    }

    view.backgroundColor = .clear
    footerView = view
  }

  // MARK: - Methods

  func setContentWidth(_ width: CGFloat) {
    guard let contentView else { return }

    let size = CGSize(width: width, height: contentView.bounds.height)

    bridge.uiManager.setSize(size, for: contentView)

    if let footerView {
      bridge.uiManager.setSize(size, for: footerView)
    }
  }

  func present(promise: Promise) {
    let rvc = reactViewController()

    guard let rvc else {
      Logger.warning("No react view controller present.")
      promise.resolve(false)
      return
    }

    viewController.preparePresentation(for: sizes, with: contentHeight)
    rvc.present(viewController, animated: true) {
      promise.resolve(true)
    }
  }
}
