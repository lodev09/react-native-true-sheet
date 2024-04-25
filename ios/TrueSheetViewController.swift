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
  func viewControllerSheetDidChangeSize(_ sizeInfo: SizeInfo)
  func viewControllerWillAppear()
  func viewControllerKeyboardWillShow(_ keyboardHeight: CGFloat)
  func viewControllerKeyboardWillHide()
}

// MARK: - TrueSheetViewController

class TrueSheetViewController: UIViewController, UISheetPresentationControllerDelegate {
  // MARK: - Properties

  weak var delegate: TrueSheetViewControllerDelegate?

  var blurView: UIVisualEffectView
  var lastViewWidth: CGFloat = 0
  var detentValues: [String: SizeInfo] = [:]

  var sizes: [Any] = ["medium", "large"]

  var maxHeight: CGFloat?
  var contentHeight: CGFloat = 0
  var footerHeight: CGFloat = 0

  var cornerRadius: CGFloat?
  var grabber = true
  var dimmed = true

  // MARK: - Setup

  init() {
    blurView = UIVisualEffectView()

    super.init(nibName: nil, bundle: nil)

    blurView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    blurView.frame = view.bounds

    view.autoresizingMask = [.flexibleHeight, .flexibleWidth]
    view.insertSubview(blurView, at: 0)
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
      delegate?.viewControllerSheetDidChangeSize(sizeInfo)
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

  @available(iOS 15.0, *)
  func setDimmed(for sheet: UISheetPresentationController) {
    if dimmed {
      sheet.largestUndimmedDetentIdentifier = nil
    } else {
      sheet.largestUndimmedDetentIdentifier = .large
      if #available(iOS 16.0, *),
         let lastIdentifier = sheet.detents.last?.identifier {
        sheet.largestUndimmedDetentIdentifier = lastIdentifier
      }
    }
  }

  /// Prepares the view controller for sheet presentation
  func configureSheet(at index: Int = 0, _ completion: ((SizeInfo) -> Void)?) {
    let defaultSizeInfo = SizeInfo(index: index, value: view.bounds.height)

    guard #available(iOS 15.0, *), let sheet = sheetPresentationController else {
      completion?(defaultSizeInfo)
      return
    }

    detentValues = [:]

    var detents: [UISheetPresentationController.Detent] = []

    for (index, size) in sizes.enumerated() {
      let detent = detentFor(size, with: contentHeight + footerHeight, with: maxHeight) { id, value in
        self.detentValues[id] = SizeInfo(index: index, value: value)
      }

      detents.append(detent)
    }

    sheet.animateChanges {
      sheet.detents = detents
      sheet.prefersEdgeAttachedInCompactHeight = true
      sheet.prefersGrabberVisible = grabber
      sheet.preferredCornerRadius = cornerRadius
      sheet.delegate = self

      var identifier: UISheetPresentationController.Detent.Identifier = .medium

      if sheet.detents.indices.contains(index) {
        let detent = sheet.detents[index]
        if #available(iOS 16.0, *) {
          identifier = detent.identifier
        } else if detent == .large() {
          identifier = .large
        }
      }

      setDimmed(for: sheet)

      sheet.selectedDetentIdentifier = identifier
      completion?(detentValues[identifier.rawValue] ?? defaultSizeInfo)
    }
  }
}
