//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

@objc(SheetifyViewManager)
class SheetifyViewManager: RCTViewManager {
  // MARK: - properties

  override var methodQueue: DispatchQueue! {
    return DispatchQueue.main
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  override func view() -> UIView? {
    return SheetifyView(with: bridge)
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

  @objc
  func handleScrollable(_ tag: NSNumber, scrollableTag: NSNumber) {
    guard let scrollView = bridge.uiManager.view(forReactTag: scrollableTag) else {
      return
    }

    let sheetifyView = getSheetifyView(tag)
    sheetifyView.handleScrollable(scrollView)
  }
}