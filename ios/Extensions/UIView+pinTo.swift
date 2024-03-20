//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

extension UIView {
  func pinTo(view: UIView, with insets: UIEdgeInsets = .zero, edges: UIRectEdge = .all) {
    translatesAutoresizingMaskIntoConstraints = false
    if edges.contains(.top) {
      topAnchor.constraint(equalTo: view.topAnchor, constant: insets.top).isActive = true
    }
    if edges.contains(.bottom) {
      bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -insets.bottom).isActive = true
    }
    if edges.contains(.left) {
      leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: insets.left).isActive = true
    }
    if edges.contains(.right) {
      trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -insets.right).isActive = true
    }
  }
}
