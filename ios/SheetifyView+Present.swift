/*
 *
 * Created by Jovanni Lo (@lodev09)
 * Copyright 2024-present
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

extension SheetifyView {
  func present(promise: Promise) {
    guard let rvc = reactViewController(), let controller else {
      return
    }

    let contentView = controller.view.subviews[0]

    if #available(iOS 15.0, *) {
      if let sheet = controller.sheetPresentationController {
        sheet.detents = [
          .medium(),
          .large()
        ]

        if #available(iOS 16.0, *) {
          sheet.detents.append(.custom() { context in
            min(contentView.frame.height, 0.5 * context.maximumDetentValue)
          })
        }

        sheet.prefersGrabberVisible = true
      }
    }

    print(controller.view.subviews[0].frame.height)
    print(controller.view.frame.size.width, controller.view.frame.size.height)

    rvc.present(controller, animated: true)
  }
}
