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

  // Reference the bottom constraint to adjust during keyboard event
  private var footerViewBottomConstraint: NSLayoutConstraint?

  // Reference height constraint during content updates
  private var footerViewHeightConstraint: NSLayoutConstraint?

  private var rctScrollView: RCTScrollView?

  // MARK: - Setup

  init(with bridge: RCTBridge) {
    self.bridge = bridge

    viewController = TrueSheetViewController()
    touchHandler = RCTTouchHandler(bridge: bridge)

    super.init(frame: .zero)

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

    viewController.view.addSubview(subview)

    containerView = subview
    touchHandler.attach(to: containerView)
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

      containerView.pinTo(view: viewController.view, constraints: nil)

      // Set footer constraints
      if let footerView {
        footerView.pinTo(view: viewController.view, from: [.left, .right, .bottom], with: 0) { constraints in
          self.footerViewBottomConstraint = constraints.bottom
          self.footerViewHeightConstraint = constraints.height
        }
      }

      // Update content containers
      setupScrollable()
    }
  }

  // MARK: - ViewController delegate

  func viewControllerKeyboardWillHide() {
    guard let footerViewBottomConstraint else { return }

    footerViewBottomConstraint.constant = 0

    UIView.animate(withDuration: 0.3) {
      self.viewController.view.layoutIfNeeded()
    }
  }

  func viewControllerKeyboardWillShow(_ keyboardHeight: CGFloat) {
    guard let footerViewBottomConstraint else { return }

    footerViewBottomConstraint.constant = -keyboardHeight

    UIView.animate(withDuration: 0.3) {
      self.viewController.view.layoutIfNeeded()
    }
  }

  func viewControllerDidChangeWidth(_ width: CGFloat) {
    guard let containerView else { return }

    let size = CGSize(width: width, height: containerView.bounds.height)
    bridge.uiManager.setSize(size, for: containerView)
  }

  func viewControllerWillAppear() {
    setupScrollable()
  }

  func viewControllerDidDismiss() {
    isPresented = false
    activeIndex = nil

    onDismiss?(nil)
  }

  func viewControllerSheetDidChangeSize(_ sizeInfo: SizeInfo) {
    if sizeInfo.index != activeIndex {
      activeIndex = sizeInfo.index
      onSizeChange?(sizeInfoData(from: sizeInfo))
    }
  }

  func invalidate() {
    viewController.dismiss(animated: true)
  }

  // MARK: - Prop setters

  @objc
  func setDismissible(_ dismissible: Bool) {
    viewController.isModalInPresentation = !dismissible
  }

  @objc
  func setMaxHeight(_ height: NSNumber) {
    viewController.maxHeight = CGFloat(height.floatValue)
    configurePresentedSheet()
  }

  @objc
  func setContentHeight(_ height: NSNumber) {
    // Exclude bottom safe area for consistency with a Scrollable content
    let window = UIApplication.shared.windows.first(where: { $0.isKeyWindow })
    let bottomInset = window?.safeAreaInsets.bottom ?? 0

    viewController.contentHeight = CGFloat(height.floatValue) - bottomInset
    configurePresentedSheet()
  }

  @objc
  func setFooterHeight(_ height: NSNumber) {
    guard let footerView, let footerViewHeightConstraint else {
      return
    }

    viewController.footerHeight = CGFloat(height.floatValue)

    if footerView.subviews.first != nil {
      containerView?.bringSubviewToFront(footerView)
      footerViewHeightConstraint.constant = viewController.footerHeight
    } else {
      containerView?.sendSubviewToBack(footerView)
      footerViewHeightConstraint.constant = 0
    }

    configurePresentedSheet()
  }

  @objc
  func setSizes(_ sizes: [Any]) {
    viewController.sizes = Array(sizes.prefix(3))
    configurePresentedSheet()
  }

  @objc
  func setBlurTint(_ tint: NSString?) {
    guard let tint else {
      viewController.blurView.effect = nil
      return
    }

    viewController.blurView.effect = UIBlurEffect(with: tint as String)
  }

  @objc
  func setCornerRadius(_ radius: NSNumber?) {
    var cornerRadius: CGFloat?
    if let radius {
      cornerRadius = CGFloat(radius.floatValue)
    }

    viewController.cornerRadius = cornerRadius
    if #available(iOS 15.0, *) {
      withPresentedSheet { sheet in
        sheet.preferredCornerRadius = viewController.cornerRadius
      }
    }
  }

  @objc
  func setGrabber(_ visible: Bool) {
    viewController.grabber = visible
    if #available(iOS 15.0, *) {
      withPresentedSheet { sheet in
        sheet.prefersGrabberVisible = visible
      }
    }
  }

  @objc
  func setDimmed(_ dimmed: Bool) {
    viewController.dimmed = dimmed

    if #available(iOS 15.0, *) {
      withPresentedSheet { sheet in
        viewController.setDimmed(for: sheet)
      }
    }
  }

  @objc
  func setScrollableHandle(_ tag: NSNumber?) {
    let view = bridge.uiManager.view(forReactTag: tag) as? RCTScrollView
    rctScrollView = view
  }

  // MARK: - Methods

  private func sizeInfoData(from sizeInfo: SizeInfo?) -> [String: Any] {
    guard let sizeInfo else {
      return ["index": 0, "value": 0.0]
    }

    return ["index": sizeInfo.index, "value": sizeInfo.value]
  }

  /// Use to customize some properties of the Sheet without fully reconfiguring.
  @available(iOS 15.0, *)
  func withPresentedSheet(completion: (UISheetPresentationController) -> Void) {
    guard isPresented, let sheet = viewController.sheetPresentationController else {
      return
    }

    sheet.animateChanges {
      completion(sheet)
    }
  }

  /// Fully reconfigure the sheet. Use during size prop changes.
  func configurePresentedSheet() {
    if isPresented {
      viewController.configureSheet(at: activeIndex ?? 0, nil)
    }
  }

  func setupScrollable() {
    guard let contentView, let containerView else { return }

    // Add constraints to fix weirdness and support ScrollView
    if let rctScrollView {
      contentView.pinTo(view: containerView, constraints: nil)
      rctScrollView.pinTo(view: contentView, constraints: nil)
    }
  }

  func dismiss(promise: Promise) {
    guard isPresented else {
      promise.resolve(nil)
      return
    }

    viewController.dismiss(animated: true) {
      promise.resolve(nil)
    }
  }

  func present(at index: Int, promise: Promise) {
    let rvc = reactViewController()

    guard let rvc else {
      promise.reject(message: "No react view controller present.")
      return
    }

    guard viewController.sizes.indices.contains(index) else {
      promise.reject(message: "Size at \(index) is not configured.")
      return
    }

    viewController.configureSheet(at: index) { sizeInfo in
      // Trigger onSizeChange event when size is changed while presenting
      if self.isPresented {
        self.viewControllerSheetDidChangeSize(sizeInfo)
        promise.resolve(nil)
      } else {
        // Keep track of the active index
        self.activeIndex = index

        rvc.present(self.viewController, animated: true) {
          self.isPresented = true

          let data = self.sizeInfoData(from: sizeInfo)
          self.onPresent?(data)
          promise.resolve(nil)
        }
      }
    }
  }
}
