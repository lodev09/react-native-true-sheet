//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

// MARK: - SizeInfo

struct SizeInfo {
  var index: Int
  var value: CGFloat
}

// MARK: - TrueSheetViewControllerDelegate

protocol TrueSheetViewControllerDelegate: AnyObject {
  func viewControllerDidChangeWidth(_ width: CGFloat)
  func viewControllerDidDismiss()
  func viewControllerDidChangeSize(_ sizeInfo: SizeInfo?)
  func viewControllerWillAppear()
  func viewControllerWillDisappear()
  func viewControllerKeyboardWillShow(_ keyboardHeight: CGFloat)
  func viewControllerKeyboardWillHide()
  func viewControllerDidDrag(_ state: UIPanGestureRecognizer.State, _ height: CGFloat)
}

// MARK: - TrueSheetViewController

class TrueSheetViewController: UIViewController, UISheetPresentationControllerDelegate {
  // MARK: - Properties

  weak var delegate: TrueSheetViewControllerDelegate?

  /// The bottomInset of the sheet.
  /// We will be excluding these on height calculation for conistency with scrollable content.
  private var bottomInset: CGFloat
  private var backgroundView: UIVisualEffectView

  var lastViewWidth: CGFloat = 0
  var detentValues: [String: SizeInfo] = [:]

  var sizes: [Any] = ["medium", "large"]

  var maxHeight: CGFloat?
  var contentHeight: CGFloat = 0
  var footerHeight: CGFloat = 0

  var backgroundColor: UIColor?
  var blurEffect: UIBlurEffect?

  var cornerRadius: CGFloat?
  var grabber = true
  var dimmed = true
  var dimmedIndex: Int? = 0

  var currentSizeInfo: SizeInfo? {
    guard #available(iOS 15.0, *), let sheet = sheetPresentationController,
          let rawValue = sheet.selectedDetentIdentifier?.rawValue else {
      return nil
    }

    return detentValues[rawValue]
  }

  // MARK: - Setup

  init() {
    backgroundView = UIVisualEffectView()

    let window = UIApplication.shared.windows.first(where: { $0.isKeyWindow })
    bottomInset = window?.safeAreaInsets.bottom ?? 0

    super.init(nibName: nil, bundle: nil)

    backgroundView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    backgroundView.frame = view.bounds

    view.autoresizingMask = [.flexibleHeight, .flexibleWidth]
    view.insertSubview(backgroundView, at: 0)
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }

  @available(*, unavailable)
  required init?(coder _: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  @available(iOS 15.0, *)
  func sheetPresentationControllerDidChangeSelectedDetentIdentifier(_ sheet: UISheetPresentationController) {
    if let rawValue = sheet.selectedDetentIdentifier?.rawValue,
       let sizeInfo = detentValues[rawValue] {
      delegate?.viewControllerDidChangeSize(sizeInfo)
    }
  }

  override func viewDidLoad() {
    super.viewDidLoad()

    NotificationCenter.default.addObserver(
      self, selector: #selector(keyboardWillShow(_:)),
      name: UIResponder.keyboardWillShowNotification,
      object: nil
    )

    NotificationCenter.default.addObserver(
      self, selector: #selector(keyboardWillHide(_:)),
      name: UIResponder.keyboardWillHideNotification,
      object: nil
    )
  }

  @objc
  func handlePanGesture(_ gesture: UIPanGestureRecognizer) {
    guard let view = gesture.view else { return }

    // Calculate visible height
    let screenHeight = UIScreen.main.bounds.height
    let sheetY = view.frame.origin.y
    let height = screenHeight - bottomInset - sheetY

    delegate?.viewControllerDidDrag(gesture.state, height)
  }

  @objc
  private func keyboardWillShow(_ notification: Notification) {
    guard let keyboardSize = (notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? NSValue)?.cgRectValue else {
      return
    }

    delegate?.viewControllerKeyboardWillShow(keyboardSize.height)
  }

  @objc
  private func keyboardWillHide(_: Notification) {
    delegate?.viewControllerKeyboardWillHide()
  }

  override func viewWillAppear(_ animated: Bool) {
    super.viewWillAppear(animated)
    delegate?.viewControllerWillAppear()
  }

  override func viewWillDisappear(_ animated: Bool) {
    super.viewWillDisappear(animated)
    delegate?.viewControllerWillDisappear()
  }

  override func viewDidDisappear(_ animated: Bool) {
    super.viewDidDisappear(animated)
    delegate?.viewControllerDidDismiss()
  }

  /// This is called multiple times while sheet is being dragged.
  /// let's try to minimize size update by comparing last known width
  override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()

    if lastViewWidth != view.frame.width {
      delegate?.viewControllerDidChangeWidth(view.bounds.width)
      lastViewWidth = view.frame.width
    }
  }

  /// Setup background. Supports color or blur effect.
  /// Can only use one or the other.
  func setupBackground() {
    if let blurEffect {
      backgroundView.effect = blurEffect
      backgroundView.backgroundColor = nil
    } else {
      backgroundView.backgroundColor = backgroundColor
      backgroundView.effect = nil
    }
  }

  /// Setup dimmed sheet.
  /// `dimmedIndex` will further customize the dimming behavior.
  @available(iOS 15.0, *)
  func setupDimmedBackground() {
    guard let sheet = sheetPresentationController else {
      return
    }

    if dimmed, dimmedIndex == 0 {
      sheet.largestUndimmedDetentIdentifier = nil
    } else {
      sheet.largestUndimmedDetentIdentifier = .large

      if #available(iOS 16.0, *) {
        if dimmed, let dimmedIndex, sheet.detents.indices.contains(dimmedIndex - 1) {
          sheet.largestUndimmedDetentIdentifier = sheet.detents[dimmedIndex - 1].identifier
        } else if let lastIdentifier = sheet.detents.last?.identifier {
          sheet.largestUndimmedDetentIdentifier = lastIdentifier
        }
      }
    }
  }

  /// Setup sheet detents by sizes.
  @available(iOS 15.0, *)
  func setupSizes() {
    guard let sheet = sheetPresentationController else {
      return
    }

    // Configure detents
    detentValues = [:]
    var detents: [UISheetPresentationController.Detent] = []

    for (index, size) in sizes.enumerated() {
      // Exclude bottom safe area for consistency with a Scrollable content
      let adjustedContentHeight = contentHeight - bottomInset
      let detent = detentFor(size, with: adjustedContentHeight + footerHeight, with: maxHeight) { id, value in
        self.detentValues[id] = SizeInfo(index: index, value: value)
      }

      detents.append(detent)
    }

    sheet.detents = detents
  }

  /// Get the detent identifier for a given index
  @available(iOS 15.0, *)
  func detentIdentifierForIndex(_ index: Int) -> UISheetPresentationController.Detent.Identifier {
    guard let sheet = sheetPresentationController else {
      return .medium
    }

    var identifier = UISheetPresentationController.Detent.Identifier.medium
    if sheet.detents.indices.contains(index) {
      let detent = sheet.detents[index]
      if #available(iOS 16.0, *) {
        identifier = detent.identifier
      } else if detent == .large() {
        identifier = .large
      }
    }

    return identifier
  }

  /// Observe while the sheet is being dragged.
  @available(iOS 15.0, *)
  func observeDrag() {
    guard let sheet = sheetPresentationController,
          let presentedView = sheet.presentedView else {
      return
    }

    for recognizer in presentedView.gestureRecognizers ?? [] {
      if let panGesture = recognizer as? UIPanGestureRecognizer {
        panGesture.addTarget(self, action: #selector(handlePanGesture(_:)))
      }
    }
  }

  /// Prepares the view controller for sheet presentation
  func prepareForPresentation(at index: Int = 0, _ completion: (() -> Void)?) {
    guard #available(iOS 15.0, *), let sheet = sheetPresentationController else {
      completion?()
      return
    }

    setupSizes()
    setupDimmedBackground()

    sheet.delegate = self
    sheet.prefersEdgeAttachedInCompactHeight = true
    sheet.prefersGrabberVisible = grabber
    sheet.preferredCornerRadius = cornerRadius
    sheet.selectedDetentIdentifier = detentIdentifierForIndex(index)

    completion?()
  }
}
