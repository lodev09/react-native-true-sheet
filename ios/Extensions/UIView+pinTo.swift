//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

extension UIView {
  func pinTo(view: UIView, from edges: UIRectEdge = .all, with height: CGFloat? = nil) {
    var constraints: [NSLayoutConstraint] = []

    if edges.contains(.top) { constraints.append(topAnchor.constraint(equalTo: view.topAnchor)) }
    if edges.contains(.bottom) { constraints.append(bottomAnchor.constraint(equalTo: view.bottomAnchor)) }
    if edges.contains(.left) { constraints.append(leadingAnchor.constraint(equalTo: view.leadingAnchor)) }
    if edges.contains(.right) { constraints.append(trailingAnchor.constraint(equalTo: view.trailingAnchor)) }

    if let height { constraints.append(heightAnchor.constraint(equalToConstant: height)) }

    if !constraints.isEmpty {
      translatesAutoresizingMaskIntoConstraints = false
      NSLayoutConstraint.activate(constraints)
    }
  }
}
