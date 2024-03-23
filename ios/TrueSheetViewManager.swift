//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

@objc(TrueSheetViewManager)
class TrueSheetViewManager: RCTViewManager {
  // MARK: - properties

  override var methodQueue: DispatchQueue! {
    return DispatchQueue.main
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  override func view() -> UIView? {
    return TrueSheetView(with: bridge)
  }

  // MARK: - Private

  private func getTrueSheetView(_ tag: NSNumber) -> TrueSheetView {
    // swiftlint:disable force_cast
    return bridge.uiManager.view(forReactTag: tag) as! TrueSheetView
    // swiftlint:enable force_cast
  }

  // MARK: - React Functions

  @objc
  func present(_ tag: NSNumber, index: Int, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let trueSheetView = getTrueSheetView(tag)
    trueSheetView.present(at: index, promise: Promise(resolver: resolve, rejecter: reject))
  }

  @objc
  func dismiss(_ tag: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let trueSheetView = getTrueSheetView(tag)
    trueSheetView.dismiss(promise: Promise(resolver: resolve, rejecter: reject))
  }
}
