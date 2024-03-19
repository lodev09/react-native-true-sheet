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

  override func view() -> (SheetifyView) {
   return SheetifyView()
  }

  // MARK: - Private

  private func getSheetView(withTag tag: NSNumber) -> SheetifyView {
    return bridge.uiManager.view(forReactTag: tag) as! SheetifyView
  }

  // MARK: - React Functions

  @objc
  func present(_ node: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    let component = getSheetView(withTag: node)
    component.present(promise: Promise(resolver: resolve, rejecter: reject))
  }
}
