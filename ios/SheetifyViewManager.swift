/*
 *
 * Created by Jovanni Lo (@lodev09)
 * Copyright 2024-present
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@objc(SheetifyViewManager)
class SheetifyViewManager: RCTViewManager {
  // MARK: - Properties

  override var methodQueue: DispatchQueue! {
    return DispatchQueue.main
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  override func view() -> SheetifyView {
    return SheetifyView()
  }

  // MARK: - Private

  private func getSheetifyView(_ tag: NSNumber) -> SheetifyView {
    // swiftlint:disable force_cast
    return bridge.uiManager.view(forReactTag: tag) as! SheetifyView
    // swiftlint:enable force_cast
  }

  // MARK: - React Functions

  @objc
  func present(_ tag: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let sheetifyView = getSheetifyView(tag)
    sheetifyView.present(promise: Promise(resolver: resolve, rejecter: reject))
  }
}
