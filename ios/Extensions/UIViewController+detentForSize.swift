//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

@available(iOS 15.0, *)
extension UISheetPresentationController.Detent.Identifier {
  static let small = UISheetPresentationController.Detent.Identifier("small")
}

@available(iOS 15.0, *)
extension UIViewController {
  private func detentFor(identifier: UISheetPresentationController.Detent.Identifier,
                         _ resolution: @escaping (CGFloat) -> Void) -> UISheetPresentationController.Detent {
    switch identifier {
    case .large:
      if #available(iOS 16.0, *) {
        return .custom(identifier: .large) { context in
          let value = UISheetPresentationController.Detent.large().resolvedValue(in: context)
          resolution(value ?? 0)
          return value
        }
      } else {
        resolution(view.frame.height)
        return .large()
      }
    case .medium:
      if #available(iOS 16.0, *) {
        return .custom(identifier: .medium) { context in
          let value = UISheetPresentationController.Detent.medium().resolvedValue(in: context)
          resolution(value ?? 0)
          return value
        }
      }
    case .small:
      if #available(iOS 16.0, *) {
        return .custom { context in
          let value = 0.25 * context.maximumDetentValue
          resolution(value)
          return value
        }
      }
    default:
      break
    }

    resolution(view.frame.height / 2)
    return .medium()
  }

  /// Get the custom detent based on the given size and view frame size
  func detentFor(_ anySize: Any, with height: CGFloat?, _ resolution: @escaping (String, CGFloat) -> Void) -> UISheetPresentationController.Detent {
    let id = "custom-\(anySize)"

    if let floatSize = anySize as? CGFloat {
      if #available(iOS 16.0, *) {
        return .custom(identifier: identifier(from: id)) { context in
          let value = min(floatSize, context.maximumDetentValue)
          resolution(id, value)
          return value
        }
      } else {
        return detentFor(identifier: .medium) { value in
          resolution(id, value)
        }
      }
    }

    if var stringSize = anySize as? String {
      switch stringSize {
      case "small":
        return detentFor(identifier: .small) { value in
          resolution(UISheetPresentationController.Detent.Identifier.small.rawValue, value)
        }
      case "medium":
        return detentFor(identifier: .medium) { value in
          resolution(UISheetPresentationController.Detent.Identifier.medium.rawValue, value)
        }
      case "large":
        return detentFor(identifier: .large) { value in
          resolution(UISheetPresentationController.Detent.Identifier.large.rawValue, value)
        }
      default:
        if #available(iOS 16.0, *) {
          if stringSize == "auto" {
            return .custom(identifier: identifier(from: id)) { context in
              let value = min(height ?? context.maximumDetentValue / 2, context.maximumDetentValue)
              resolution(id, value)
              return value
            }
          } else {
            // Percent
            stringSize.removeAll(where: { $0 == "%" })
            let floatSize = CGFloat((stringSize as NSString).floatValue)
            if floatSize > 0.0 {
              return .custom(identifier: identifier(from: id)) { context in
                let value = min((floatSize / 100) * context.maximumDetentValue, context.maximumDetentValue)
                resolution(id, value)
                return value
              }
            }
          }
        } else {
          return detentFor(identifier: .medium) { value in
            resolution(id, value)
          }
        }
      }
    }

    resolution(id, 0)
    return .medium()
  }

  func identifier(from id: String) -> UISheetPresentationController.Detent.Identifier {
    return UISheetPresentationController.Detent.Identifier(id)
  }
}
