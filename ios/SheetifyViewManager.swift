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
