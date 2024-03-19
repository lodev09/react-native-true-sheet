/*
 *
 * Created by Jovanni Lo (@lodev09)
 * Copyright 2024-present
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

extension SheetifyView {
  func present(promise _: Promise) {
    guard let rvc = reactViewController() else {
      return
    }

    controller.prepareForPresentation()
    rvc.present(controller, animated: true)
  }
}
