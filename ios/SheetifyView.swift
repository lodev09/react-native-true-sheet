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

  private var containerView: UIView?

  private var contentView: UIView?
  private var footerView: UIView?
  private var rctScrollView: RCTScrollView?

  private var isContentMounted: Bool {
    return contentView != nil
  }

  private var bottomInset: CGFloat {
    let window = UIApplication.shared.windows.first(where: { $0.isKeyWindow })
    return window?.safeAreaInsets.bottom ?? 0
  }

  // Content height minus the footer height for `auto` layout
  private var contentHeight: CGFloat {
    guard let contentView else { return 0 }

    var height = contentView.frame.height
    if let footerView { height += footerView.frame.height }

    // Exclude bottom safe area for consistency with a Scrollable content
    return height - bottomInset
  }

  // MARK: - Setup

  init(with bridge: RCTBridge) {
    self.bridge = bridge

    viewController = SheetifyViewController()
    viewController.view.autoresizingMask = [.flexibleHeight, .flexibleWidth]

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

  override func insertReactSubview(_ subview: UIView!, at index: Int) {
    super.insertReactSubview(subview, at: index)

    guard containerView == nil else {
      Logger.error("Sheetify can only have one content view.")
      return
    }

    viewController.view.insertSubview(subview, at: 0)
    viewController.view.backgroundColor = backgroundColor ?? .white
    backgroundColor = .clear

    containerView = subview
    touchHandler.attach(to: subview)
  }

  override func removeReactSubview(_ subview: UIView!) {
    guard subview == containerView else {
      Logger.error("Cannot remove view other than sheet view")
      return
    }

    super.removeReactSubview(subview)

    touchHandler.detach(from: subview)

    containerView = nil
    contentView = nil
    footerView = nil
  }

  override func didUpdateReactSubviews() {
    // Do nothing, as subviews are managed by `insertReactSubview`
  }

  override func layoutSubviews() {
    super.layoutSubviews()

    if let containerView, contentView == nil {
      contentView = containerView.subviews.first
      setupContentIfNeeded()
    }
  }

  // MARK: - Prop setters

  @objc
  func setScrollableHandle(_ tag: NSNumber?) {
    let view = bridge.uiManager.view(forReactTag: tag) as? RCTScrollView
    rctScrollView = view
    setupContentIfNeeded()
  }

  @objc
  func setFooterHandle(_ tag: NSNumber?) {
    let view = bridge.uiManager.view(forReactTag: tag)
    footerView = view
    setupContentIfNeeded()
  }

  // MARK: - Methods

  func setupContentIfNeeded() {
    guard isContentMounted, let containerView else { return }

    containerView.pinTo(view: viewController.view)

    // Add constraints to fix weirdness and support ScrollView
    if let contentView, let rctScrollView, let scrollView = rctScrollView.scrollView {
      contentView.pinTo(view: containerView)
      rctScrollView.pinTo(view: contentView)

      if let footerView {
        scrollView.contentInset.bottom = footerView.frame.height
        scrollView.verticalScrollIndicatorInsets.bottom = footerView.frame.height - bottomInset
      } else {
        scrollView.contentInset.bottom = 0
        scrollView.verticalScrollIndicatorInsets.bottom = 0
      }
    }

    // Pin footer at the bottom
    if let footerView {
      containerView.bringSubviewToFront(footerView)
      footerView.pinTo(
        view: viewController.view,
        from: [.bottom, .left, .right],
        with: footerView.frame.height
      )
    }
  }

  func setContentWidth(_ width: CGFloat) {
    guard let containerView else { return }

    let size = CGSize(width: width, height: containerView.bounds.height)
    bridge.uiManager.setSize(size, for: containerView)

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

    viewController.updateSheet(for: sizes, with: contentHeight)
    rvc.present(viewController, animated: true) {
      promise.resolve(true)
    }
  }
}
