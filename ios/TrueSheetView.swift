//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

@objc(TrueSheetView)
class TrueSheetView: UIView, RCTInvalidating, TrueSheetViewControllerDelegate {
  // MARK: - Static properties

  // Keep track of active sheet opacity values (stack)
  private static var sheetOpacityStack: [CGFloat] = []

  // MARK: - React properties

  // MARK: - Events

  @objc var onMount: RCTDirectEventBlock?
  @objc var onDismiss: RCTDirectEventBlock?
  @objc var onPresent: RCTDirectEventBlock?
  @objc var onSizeChange: RCTDirectEventBlock?
  @objc var onContainerSizeChange: RCTDirectEventBlock?
  @objc var onDragBegin: RCTDirectEventBlock?
  @objc var onDragChange: RCTDirectEventBlock?
  @objc var onDragEnd: RCTDirectEventBlock?

  // MARK: - React Properties

  @objc var initialIndex: NSNumber = -1
  @objc var initialIndexAnimated = true
  @objc var dimmedAlpha: CGFloat = 0.75

  // MARK: - Private properties

  private var isPresented = false
  private var activeIndex: Int?
  private var bridge: RCTBridge?
  private var eventDispatcher: (any RCTEventDispatcherProtocol)?
  private var viewController: TrueSheetViewController

  private var touchHandler: RCTTouchHandler
  // New Arch
  private var surfaceTouchHandler: RCTSurfaceTouchHandler

  // MARK: - Content properties

  private var containerView: UIView?
  private var contentView: UIView?
  private var footerView: UIView?
  private var scrollView: UIView?

  // Bottom: Reference the bottom constraint to adjust during keyboard event
  // Height: Reference height constraint during content updates
  private var footerConstraints: Constraints?

  private var uiManager: RCTUIManager? {
    guard let uiManager = bridge?.uiManager else { return nil }
    return uiManager
  }

  // MARK: - Setup

  init(with bridge: RCTBridge) {
    self.bridge = bridge
    eventDispatcher = bridge.eventDispatcher()

    viewController = TrueSheetViewController()
    touchHandler = RCTTouchHandler(bridge: bridge)
    surfaceTouchHandler = RCTSurfaceTouchHandler()

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

    containerView = subview

    viewController.view.addSubview(subview)
    touchHandler.attach(to: subview)
    surfaceTouchHandler.attach(to: subview)
  }

  override func removeReactSubview(_ subview: UIView!) {
    guard subview == containerView else {
      Logger.error("Cannot remove view other than sheet view")
      return
    }

    super.removeReactSubview(subview)

    // Touch handler for Old Arch
    touchHandler.detach(from: subview)

    // Touch handler that works in New Arch
    surfaceTouchHandler.detach(from: subview)

    // Remove all constraints
    // Fixes New Arch weird layout issue :/
    containerView?.unpin()
    footerView?.unpin()
    contentView?.unpin()
    scrollView?.unpin()

    containerView = nil
    contentView = nil
    footerView = nil
    scrollView = nil
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

      if let contentView {
        // Set initial content height
        let contentHeight = contentView.bounds.height
        setContentHeight(NSNumber(value: contentHeight))
      }

      // Set footer constraints
      if let footerView {
        footerView.pinTo(view: viewController.view, from: [.left, .right, .bottom], with: 0) { constraints in
          self.footerConstraints = constraints
        }

        // Set initial footer height
        let footerHeight = footerView.bounds.height
        setFooterHeight(NSNumber(value: footerHeight))
      }

      // Present sheet at initial index
      let initialIndex = self.initialIndex.intValue
      if initialIndex >= 0 {
        present(at: initialIndex, promise: nil, animated: initialIndexAnimated)
      }

      dispatchEvent(name: "onMount", block: onMount, data: nil)
    }
  }

  // MARK: - ViewController delegate

  func viewControllerKeyboardWillHide() {
    footerConstraints?.bottom?.constant = 0

    UIView.animate(withDuration: 0.3) {
      self.viewController.view.layoutIfNeeded()
    }
  }

  func viewControllerKeyboardWillShow(_ keyboardHeight: CGFloat) {
    footerConstraints?.bottom?.constant = -keyboardHeight

    UIView.animate(withDuration: 0.3) {
      self.viewController.view.layoutIfNeeded()
    }
  }

  func viewControllerDidChangeWidth(_ width: CGFloat) {
    // We only pass width to JS since height is handled by the constraints
    dispatchEvent(name: "onContainerSizeChange", block: onContainerSizeChange, data: ["width": width])
  }

  func viewControllerDidDrag(_ state: UIGestureRecognizer.State, _ height: CGFloat) {
    let sizeInfo = SizeInfo(index: activeIndex ?? 0, value: height)

    switch state {
    case .began:
      dispatchEvent(name: "onDragBegin", block: onDragBegin, data: sizeInfoData(from: sizeInfo))
    case .changed:
      dispatchEvent(name: "onDragChange", block: onDragChange, data: sizeInfoData(from: sizeInfo))
    case .ended, .cancelled:
      dispatchEvent(name: "onDragEnd", block: onDragEnd, data: sizeInfoData(from: sizeInfo))
    default:
      Logger.info("Drag state is not supported")
    }
  }

  func viewControllerWillAppear() {
    // Only apply dimming if the sheet has dimmed property set to true
    if viewController.dimmed {
      let opacity = 1 - dimmedAlpha
      // Add this sheet's opacity to the stack and dim root view controller
      TrueSheetView.sheetOpacityStack.append(opacity)
      UIView.animate(withDuration: 0.3) {
        if let rootViewController = UIApplication.shared.windows.first?.rootViewController {
          rootViewController.view.alpha = opacity
        }
      }
    }

    guard let contentView, let scrollView, let containerView else {
      return
    }

    // Add constraints to fix weirdness and support ScrollView
    contentView.pinTo(view: containerView, constraints: nil)
    scrollView.pinTo(view: contentView, constraints: nil)
  }

  func viewControllerWillDisappear() {
    if viewController.isBeingDismissed && viewController.dimmed {
      if !TrueSheetView.sheetOpacityStack.isEmpty {
        TrueSheetView.sheetOpacityStack.removeLast()
      }

      UIView.animate(withDuration: 0.3) {
        if let rootViewController = UIApplication.shared.windows.first?.rootViewController {
          // If there are still active sheets, apply the alpha of the topmost one
          if let topmostOpacity = TrueSheetView.sheetOpacityStack.last {
            rootViewController.view.alpha = topmostOpacity
          } else {
            // If no sheets are left, restore alpha to 1
            rootViewController.view.alpha = 1
          }
        }
      }
    }
  }

  func viewControllerDidDismiss() {
    isPresented = false
    activeIndex = nil
    dispatchEvent(name: "onDismiss", block: onDismiss, data: nil)
  }

  func viewControllerDidChangeSize(_ sizeInfo: SizeInfo?) {
    guard let sizeInfo else { return }

    if sizeInfo.index != activeIndex {
      activeIndex = sizeInfo.index
      dispatchEvent(name: "onSizeChange", block: onSizeChange, data: sizeInfoData(from: sizeInfo))
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
    let maxHeight = CGFloat(height.floatValue)
    guard viewController.maxHeight != maxHeight else {
      return
    }

    viewController.maxHeight = maxHeight

    if #available(iOS 15.0, *) {
      withPresentedSheet { _ in
        viewController.setupSizes()
      }
    }
  }

  @objc
  func setContentHeight(_ height: NSNumber) {
    let contentHeight = CGFloat(height.floatValue)
    guard viewController.contentHeight != contentHeight else {
      return
    }

    viewController.contentHeight = contentHeight

    if #available(iOS 15.0, *) {
      withPresentedSheet { _ in
        viewController.setupSizes()
      }
    }
  }

  @objc
  func setFooterHeight(_ height: NSNumber) {
    let footerHeight = CGFloat(height.floatValue)
    guard let footerView, viewController.footerHeight != footerHeight else {
      return
    }

    viewController.footerHeight = footerHeight

    if footerView.subviews.first != nil {
      containerView?.bringSubviewToFront(footerView)
      footerConstraints?.height?.constant = viewController.footerHeight
    } else {
      containerView?.sendSubviewToBack(footerView)
      footerConstraints?.height?.constant = 0
    }

    if #available(iOS 15.0, *) {
      withPresentedSheet { _ in
        viewController.setupSizes()
      }
    }
  }

  @objc
  func setSizes(_ sizes: [Any]) {
    viewController.sizes = Array(sizes.prefix(3))

    if #available(iOS 15.0, *) {
      withPresentedSheet { _ in
        viewController.setupSizes()
      }
    }
  }

  @objc
  func setBackground(_ color: NSNumber?) {
    viewController.backgroundColor = RCTConvert.uiColor(color)
    viewController.setupBackground()
  }

  @objc
  func setBlurTint(_ tint: NSString?) {
    if let tint {
      viewController.blurEffect = UIBlurEffect(with: tint as String)
    } else {
      viewController.blurEffect = nil
    }

    viewController.setupBackground()
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
    guard viewController.dimmed != dimmed else {
      return
    }

    viewController.dimmed = dimmed

    if #available(iOS 15.0, *) {
      withPresentedSheet { _ in
        viewController.setupDimmedBackground()
      }
    }
  }

  @objc
  func setDimmedIndex(_ index: NSNumber) {
    guard viewController.dimmedIndex != index.intValue else {
      return
    }

    viewController.dimmedIndex = index.intValue

    if #available(iOS 15.0, *) {
      withPresentedSheet { _ in
        viewController.setupDimmedBackground()
      }
    }
  }

  @objc
  func setScrollableHandle(_ tag: NSNumber?) {
    scrollView = uiManager?.view(forReactTag: tag)
  }

  // MARK: - Methods

  private func sizeInfoData(from sizeInfo: SizeInfo?) -> [String: Any]? {
    guard let sizeInfo else {
      return nil
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

  func dispatchEvent(name: String, block: RCTDirectEventBlock?, data: [String: Any]?) {
    // eventDispatcher doesn't work in New Arch so we need to call it directly :/
    // we needed eventDispatcher for Reanimated to work on old arch.
    #if RCT_NEW_ARCH_ENABLED
      block?(data)
    #else
      eventDispatcher?.send(TrueSheetEvent(viewTag: reactTag, name: name, data: data))
    #endif
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

  func present(at index: Int, promise: Promise?, animated: Bool = true) {
    let rvc = reactViewController()

    guard let rvc else {
      promise?.reject(message: "No react view controller present.")
      return
    }

    guard viewController.sizes.indices.contains(index) else {
      promise?.reject(message: "Size at \(index) is not configured.")
      return
    }

    if isPresented {
      withPresentedSheet { sheet in
        sheet.selectedDetentIdentifier = viewController.detentIdentifierForIndex(index)

        // Trigger onSizeChange event when size is changed while presenting
        viewControllerDidChangeSize(self.viewController.currentSizeInfo)
        promise?.resolve(nil)
      }
    } else {
      viewController.prepareForPresentation(at: index) {
        // Keep track of the active index
        self.activeIndex = index
        self.isPresented = true

        rvc.present(self.viewController, animated: animated) {
          if #available(iOS 15.0, *) {
            self.viewController.observeDrag()
          }

          let data = self.sizeInfoData(from: self.viewController.currentSizeInfo)
          self.dispatchEvent(name: "onPresent", block: self.onPresent, data: data)
          promise?.resolve(nil)
        }
      }
    }
  }
}
