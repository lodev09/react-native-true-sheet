//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

class TrueSheetEvent: NSObject, RCTEvent {
  var viewTag: NSNumber

  private var name: String
  private var data: [String: Any]?

  var eventName: String {
    return name
  }

  var coalescingKey: UInt16 {
    return 0
  }

  init(viewTag: NSNumber, name: String, data: [String: Any]?) {
    self.name = name
    self.viewTag = viewTag
    self.data = data
  }

  static func moduleDotMethod() -> String {
    return "RCTEventEmitter.receiveEvent"
  }

  func arguments() -> [Any] {
    return [
      viewTag,
      RCTNormalizeInputEventName(eventName)!,
      data ?? [:],
    ]
  }

  func canCoalesce() -> Bool {
    return true
  }

  func coalesce(with newEvent: RCTEvent) -> RCTEvent {
    return newEvent
  }
}
