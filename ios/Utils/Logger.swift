//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

import Foundation

// MARK: - Logger

enum Logger {
  /**
   Log a message to the console in the format of `Sheetify.[caller-function-name]: [message]`

   @discussion
   If the global ConsoleLogFunction is set, this function also logs to the JavaScript console (console.log, console.trace, console.warn or console.error)
   This function also always logs to [RCTDefaultLogFunction].
   In non-DEBUG builds, this function is no-op.
   */
  static func log(level: RCTLogLevel,
                  message: String,
                  _ file: String = #file,
                  _ lineNumber: Int = #line,
                  _ function: String = #function) {
    #if DEBUG
      RCTDefaultLogFunction(level, RCTLogSource.native, file, lineNumber as NSNumber, "Sheetify[\(function)]: \(message)")
    #endif
  }

  static func info(_ message: String) {
    log(level: .info, message: message)
  }

  static func warning(_ message: String) {
    log(level: .warning, message: message)
  }

  static func error(_ message: String) {
    log(level: .error, message: message)
  }
}
