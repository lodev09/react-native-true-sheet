//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

@objc(TrueSheetView)
class TrueSheetView: UIView, RCTInvalidating, TrueSheetViewControllerDelegate {
  // MARK: - React properties

  var sizes: [Any] = ["medium", "large"]

  // Events
  @objc var onDismiss: RCTDirectEventBlock?
  @objc var onPresent: RCTDirectEventBlock?
  @objc var onSizeChange: RCTDirectEventBlock?

  // MARK: - Private properties

  private var isPresented = false
  private var activeIndex: Int?
  private var bridge: RCTBridge
  private var touchHandler: RCTTouchHandler
  private var viewController: TrueSheetViewController

  // MARK: - Content properties

  private var containerView: UIView?

  private var contentView: UIView?
  private var footerView: UIView?
  private var rctScrollView: RCTScrollView?

  // Content height minus the footer height for `auto` layout
  private var contentHeight: CGFloat {
    guard let contentView else { return 0 }

    var height = contentView.frame.height

    // Add footer view's height
    if let footerContent = footerView?.subviews.first {
      height += footerContent.bounds.height
    }

    // Exclude bottom safe area for consistency with a Scrollable content
    let window = UIApplication.shared.windows.first(where: { $0.isKeyWindow })
    let bottomInset = window?.safeAreaInsets.bottom ?? 0

    return height - bottomInset
  }

  // MARK: - Setup

  init(with bridge: RCTBridge) {
    self.bridge = bridge

    viewController = TrueSheetViewController()
    touchHandler = RCTTouchHandler(bridge: bridge)

    super.init(frame: .zero)

    viewController.view.autoresizingMask = [.flexibleHeight, .flexibleWidth]
    viewController.delegate = self
  }

  @available(*, unavailable)
  required init?(coder _: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func insertReactSubview(_ subview: UIView!, at index: Int) {
    super.insertReactSubview(subview, at: index)

    guard containerView == nil else {
      Logger.error("Sheet can only have one content view.")
      return
    }

    viewController.view.insertSubview(subview, at: 0)

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
      contentView = containerView.subviews[0]
      footerView = containerView.subviews[1]

      containerView.pinTo(view: viewController.view)

      // Setup content constraints
      setupContent()
    }
  }

  // MARK: - ViewController delegate

  func viewControllerDidChangeWidth(_ width: CGFloat) {
    guard let containerView else { return }

    let size = CGSize(width: width, height: containerView.bounds.height)
    bridge.uiManager.setSize(size, for: containerView)

    if let footerView {
      bridge.uiManager.setSize(size, for: footerView)
    }
  }

  func viewControllerWillAppear() {
    setupContent()
  }

  func viewControllerDidDismiss() {
    isPresented = false
    activeIndex = nil

    onDismiss?(nil)
  }

  func viewControllerSheetDidChangeSize(_ value: CGFloat, at index: Int) {
    if index != activeIndex {
      activeIndex = index
      onSizeChange?(["index": index, "value": value])
    }
  }

  // MARK: - Prop setters

  @objc
  func setSizes(_ sizes: [Any]) {
    self.sizes = Array(sizes.prefix(3))
    configureSheetIfPresented()
  }

  @objc
  func setScrollableHandle(_ tag: NSNumber?) {
    let view = bridge.uiManager.view(forReactTag: tag) as? RCTScrollView
    rctScrollView = view
  }

  func invalidate() {
    viewController.dismiss(animated: true)
  }

  // MARK: - Methods

  func configureSheetIfPresented() {
    // Resize sheet
    if #available(iOS 15.0, *), isPresented {
      viewController.configureSheet(for: sizes, at: activeIndex ?? 0, with: contentHeight, nil)
    }
  }

  func dismiss(promise: Promise) {
    if isPresented {
      viewController.dismiss(animated: true) {
        promise.resolve(true)
      }
    }
  }

  func setupContent() {
    guard let contentView, let containerView else { return }

    // Add constraints to fix weirdness and support ScrollView
    if let rctScrollView {
      contentView.pinTo(view: containerView)
      rctScrollView.pinTo(view: contentView)
    }

    // Pin footer at the bottom
    if let footerView {
      if let footerContent = footerView.subviews.first {
        containerView.bringSubviewToFront(footerView)
        footerView.pinTo(
          view: viewController.view,
          from: [.bottom, .left, .right],
          with: footerContent.bounds.height
        )
      } else {
        containerView.sendSubviewToBack(footerView)
        footerView.removeConstraints(footerView.constraints)
      }
    }
  }

  func present(at index: Int, promise: Promise) {
    let rvc = reactViewController()

    guard let rvc else {
      promise.reject(message: "No react view controller present.")
      return
    }

    guard sizes.indices.contains(index) else {
      promise.reject(message: "Size at \(index) is not configured.")
      return
    }

    if #available(iOS 15.0, *) {
      viewController.configureSheet(for: sizes, at: index, with: contentHeight) {
        if self.isPresented {
          // Notify when size is changed programatically
          let info = self.viewController.detentValues.first(where: { $0.value.index == index })
          if let sizeValue = info?.value.value {
            self.viewControllerSheetDidChangeSize(sizeValue, at: index)
          }
        }
      }
    }

    if !isPresented {
      // Keep track of the active index
      activeIndex = index

      rvc.present(viewController, animated: true) {
        self.isPresented = true
        self.onPresent?(nil)

        promise.resolve(true)
      }
    }
  }
}
