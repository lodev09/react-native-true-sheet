//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

// MARK: - Constraints

struct Constraints {
  var top: NSLayoutConstraint?
  var bottom: NSLayoutConstraint?
  var left: NSLayoutConstraint?
  var right: NSLayoutConstraint?
  var height: NSLayoutConstraint?
}

extension UIView {
  /// Pin a view to the given view.
  /// Optionally accepts a completion handler for the resulting constraints
  func pinTo(
    view: UIView,
    from edges: UIRectEdge = .all,
    with height: CGFloat? = nil,
    constraints: ((Constraints) -> Void)?
  ) {
    translatesAutoresizingMaskIntoConstraints = false

    var topConstraint: NSLayoutConstraint?
    var bottomConstraint: NSLayoutConstraint?
    var leftConstraint: NSLayoutConstraint?
    var rightConstraint: NSLayoutConstraint?
    var heightConstraint: NSLayoutConstraint?

    if edges.contains(.top) {
      topConstraint = topAnchor.constraint(equalTo: view.topAnchor)
      topConstraint?.isActive = true
    }

    if edges.contains(.bottom) {
      bottomConstraint = bottomAnchor.constraint(equalTo: view.bottomAnchor)
      bottomConstraint?.isActive = true
    }

    if edges.contains(.left) {
      leftConstraint = leadingAnchor.constraint(equalTo: view.leadingAnchor)
      leftConstraint?.isActive = true
    }

    if edges.contains(.right) {
      rightConstraint = trailingAnchor.constraint(equalTo: view.trailingAnchor)
      rightConstraint?.isActive = true
    }

    if let height {
      heightConstraint = heightAnchor.constraint(equalToConstant: height)
      heightConstraint?.isActive = true
    }

    constraints?(Constraints(
      top: topConstraint,
      bottom: bottomConstraint,
      left: leftConstraint,
      right: rightConstraint,
      height: heightConstraint
    ))
  }

  func unpin() {
    translatesAutoresizingMaskIntoConstraints = true
    removeConstraints(constraints)
  }
}
