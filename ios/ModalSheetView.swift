@objc(ModalSheetView)
class ModalSheetView : UIView {
  var controller: ModalSheetViewController?
  
  override public init(frame: CGRect) {
    super.init(frame: frame)
    controller = ModalSheetViewController()
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
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
  
  // MARK: - Overrides
  
  override func insertReactSubview(_ subview: UIView!, at atIndex: Int) {
    // The main controller view is the 1st child of the sheet component
    controller?.view = subview
  }
}
