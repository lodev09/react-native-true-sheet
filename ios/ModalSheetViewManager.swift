@objc(ModalSheetViewManager)
class ModalSheetViewManager: RCTViewManager {
  // MARK: - Properties
  
  override var methodQueue: DispatchQueue! {
    return DispatchQueue.main
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

 override func view() -> (ModalSheetView) {
   return ModalSheetView()
 }

  // MARK: - Private
  private func getSheetView(withTag tag: NSNumber) -> ModalSheetView {
    return bridge.uiManager.view(forReactTag: tag) as! ModalSheetView
  }
  
  // MARK: - React Functions

  @objc
  func present(_ node: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    let component = getSheetView(withTag: node)
    component.present(promise: Promise(resolver: resolve, rejecter: reject))
  }
}
