
class Promise {
  
  private let resolver: RCTPromiseResolveBlock
  private let rejecter: RCTPromiseRejectBlock

  init(resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    self.resolver = resolver
    self.rejecter = rejecter
  }

  func reject(message: String) {
    rejecter("Error", message, nil)
  }

  func resolve(_ value: Any?) {
    resolver(value)
  }
}
