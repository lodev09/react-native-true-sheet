//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

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
