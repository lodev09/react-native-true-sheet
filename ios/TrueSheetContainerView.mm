//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "TrueSheetContainerView.h"
#import <react/renderer/components/TrueSheetSpec/ComponentDescriptors.h>
#import <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>
#import <react/renderer/components/TrueSheetSpec/RCTComponentViewHelpers.h>
#import "TrueSheetContentView.h"
#import "TrueSheetFooterView.h"
#import "TrueSheetView.h"
#import "TrueSheetViewController.h"
#import "utils/LayoutUtil.h"

#import <React/RCTConversions.h>

using namespace facebook::react;

@interface TrueSheetContainerView () <TrueSheetContentViewDelegate, TrueSheetViewControllerDelegate>
@end

@implementation TrueSheetContainerView {
  __weak TrueSheetView *_sheetView;
  TrueSheetViewController *_controller;
  TrueSheetContentView *_contentView;
  TrueSheetFooterView *_footerView;

  BOOL _isPresented;
  NSNumber *_activeIndex;
}

@synthesize controller = _controller;

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<TrueSheetContainerViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const TrueSheetContainerViewProps>();
    _props = defaultProps;

    // Set background color to clear by default
    self.backgroundColor = [UIColor clearColor];

    // Initialize controller
    _controller = [[TrueSheetViewController alloc] init];
    _controller.delegate = self;

    _sheetView = nil;
    _contentView = nil;
    _footerView = nil;
    _isPresented = NO;
    _activeIndex = nil;
  }
  return self;
}

- (void)dealloc {
  // Dismiss the sheet if it's currently being presented
  if (_controller && _isPresented) {
    [_controller dismissViewControllerAnimated:NO completion:nil];
  }

  // Clean up controller
  _controller.delegate = nil;
  _controller = nil;

  _isPresented = NO;
  _activeIndex = nil;
}

- (void)setupInSheetView:(TrueSheetView *)sheetView {
  // Store reference to sheet view
  _sheetView = sheetView;

  // Get the controller's view as the parent view
  UIView *parentView = _controller.view;

  // Add to parent view hierarchy
  [parentView addSubview:self];

  // Pin container to fill the entire parent view
  [LayoutUtil pinView:self toParentView:parentView edges:UIRectEdgeAll];

  // Ensure container is above background view
  [parentView bringSubviewToFront:self];
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [super mountChildComponentView:childComponentView index:index];

  // Check if it's a content or footer view
  if ([childComponentView isKindOfClass:[TrueSheetContentView class]]) {
    if (_contentView != nil) {
      NSLog(@"TrueSheet: Container can only have one content component.");
      return;
    }

    _contentView = (TrueSheetContentView *)childComponentView;

    // Set delegate to listen for size changes
    _contentView.delegate = self;

    // Set initial content height from mounted view's frame
    if (_contentView.frame.size.height > 0) {
      _controller.contentHeight = @(_contentView.frame.size.height);
    }

    // Setup content view with controller
    [_contentView setupWithController:_controller];
  }

  if ([childComponentView isKindOfClass:[TrueSheetFooterView class]]) {
    if (_footerView != nil) {
      NSLog(@"TrueSheet: Container can only have one footer component.");
      return;
    }

    _footerView = (TrueSheetFooterView *)childComponentView;

    // Setup footer view with controller
    [_footerView setupWithController:_controller];
  }
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  if ([childComponentView isKindOfClass:[TrueSheetContentView class]]) {
    [_contentView cleanup];
    _contentView = nil;
  }

  if ([childComponentView isKindOfClass:[TrueSheetFooterView class]]) {
    [_footerView cleanup];
    _footerView = nil;
  }

  [super unmountChildComponentView:childComponentView index:index];
}

- (void)cleanup {
  // Cleanup child views
  if (_contentView) {
    [_contentView cleanup];
    _contentView = nil;
  }

  if (_footerView) {
    [_footerView cleanup];
    _footerView = nil;
  }

  // Unpin and remove from view hierarchy
  [LayoutUtil unpinView:self];
  [self removeFromSuperview];

  // Clear reference to sheet view
  _sheetView = nil;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps {
  [super updateProps:props oldProps:oldProps];
  // Props are accessed from the sheet view when needed
}

- (void)applyPropsFromSheetView {
  if (!_sheetView) {
    return;
  }

  // Get props from the sheet view
  const auto &props = *std::static_pointer_cast<TrueSheetViewProps const>(_sheetView.props);

  // Update detents - pass numbers directly (-1 represents "auto")
  NSMutableArray *detents = [NSMutableArray new];
  for (const auto &detent : props.detents) {
    [detents addObject:@(detent)];
  }

  _controller.detents = detents;

  // Update background color
  if (props.background != 0) {
    UIColor *color = RCTUIColorFromSharedColor(SharedColor(props.background));
    _controller.backgroundColor = color;
  }

  // Update blur tint
  if (!props.blurTint.empty()) {
    _controller.blurTint = RCTNSStringFromString(props.blurTint);
  }

  // Update corner radius
  if (props.cornerRadius < 0) {
    _controller.cornerRadius = nil;
  } else {
    _controller.cornerRadius = @(props.cornerRadius);
  }

  // Update max height
  if (props.maxHeight != 0.0) {
    _controller.maxHeight = @(props.maxHeight);
  }

  // Update grabber
  _controller.grabber = props.grabber;

  // Update dismissible
  _controller.modalInPresentation = !props.dismissible;

  // Update dimmed
  _controller.dimmed = props.dimmed;

  // Update dimmedIndex
  if (props.dimmedIndex >= 0) {
    _controller.dimmedIndex = @(props.dimmedIndex);
  }

  // Apply changes to presented sheet if needed
  if (_isPresented) {
    [_controller.sheetPresentationController animateChanges:^{
      [_controller setupDetents];
      [_controller setupDimmedBackground];
      [_controller resizeToIndex:[_activeIndex integerValue]];
    }];
  }
}

#pragma mark - Presentation Methods

- (void)presentAtIndex:(NSInteger)index
                  animated:(BOOL)animated
  presentingViewController:(UIViewController *)presentingViewController
                completion:(nullable TrueSheetCompletionBlock)completion {
  if (_isPresented) {
    [_controller.sheetPresentationController animateChanges:^{
      [_controller resizeToIndex:index];
    }];

    if (completion) {
      completion(YES, nil);
    }
    return;
  }

  if (!presentingViewController) {
    NSError *error = [NSError errorWithDomain:@"com.lodev09.TrueSheet"
                                         code:1001
                                     userInfo:@{NSLocalizedDescriptionKey : @"No presenting view controller found"}];

    if (completion) {
      completion(NO, error);
    }
    return;
  }

  _isPresented = YES;
  _activeIndex = @(index);

  // Apply initial props from sheet view before presenting
  [self applyPropsFromSheetView];

  // Prepare the sheet with the correct initial index before presenting
  [_controller prepareForPresentationAtIndex:index
                                  completion:^{
                                    [presentingViewController presentViewController:self->_controller
                                                                           animated:animated
                                                                         completion:^{
                                                                           // Call completion handler
                                                                           if (completion) {
                                                                             completion(YES, nil);
                                                                           }
                                                                         }];
                                  }];
}

- (void)dismissAnimated:(BOOL)animated completion:(nullable TrueSheetCompletionBlock)completion {
  if (!_isPresented) {
    if (completion) {
      completion(YES, nil);
    }
    return;
  }

  [_controller dismissViewControllerAnimated:animated
                                  completion:^{
                                    if (completion) {
                                      completion(YES, nil);
                                    }
                                  }];
}

- (void)resizeToIndex:(NSInteger)index {
  _activeIndex = @(index);

  if (_isPresented) {
    [_controller.sheetPresentationController animateChanges:^{
      [_controller resizeToIndex:index];
    }];
  }
}

#pragma mark - TrueSheetViewControllerDelegate

- (void)viewControllerWillAppear {
  // Notify sheet view to emit event
  if (_sheetView) {
    [_sheetView notifyWillPresent];
  }
}

- (void)viewControllerDidAppear {
  // Notify sheet view to emit event
  if (_sheetView) {
    [_sheetView notifyDidPresent];
  }
}

- (void)viewControllerDidDrag:(UIGestureRecognizerState)state index:(NSInteger)index position:(CGFloat)position {
  // Notify sheet view to emit event
  if (_sheetView) {
    [_sheetView notifyDidDrag:state index:index position:position];
  }
}

- (void)viewControllerWillDismiss {
  // Notify sheet view to emit event
  if (_sheetView) {
    [_sheetView notifyWillDismiss];
  }
}

- (void)viewControllerDidDismiss {
  _isPresented = NO;
  _activeIndex = nil;

  // Notify sheet view to emit event
  if (_sheetView) {
    [_sheetView notifyDidDismiss];
  }
}

- (void)viewControllerDidChangeDetent:(NSInteger)index position:(CGFloat)position {
  if (!_activeIndex || [_activeIndex integerValue] != index) {
    _activeIndex = @(index);

    // Notify sheet view to emit event
    if (_sheetView) {
      [_sheetView notifyDidChangeDetent:index position:position];
    }
  }
}

- (void)viewControllerDidChangePosition:(NSInteger)index position:(CGFloat)position transitioning:(BOOL)transitioning {
  // Notify sheet view to emit event
  if (_sheetView) {
    [_sheetView notifyDidChangePosition:index position:position transitioning:transitioning];
  }
}

#pragma mark - TrueSheetContentViewDelegate

- (void)containerViewDidChangeSize:(CGSize)newSize {
  // Update controller's content height
  _controller.contentHeight = @(newSize.height);

  // Update detents if sheet is already presented
  if (_isPresented) {
    [_controller.sheetPresentationController animateChanges:^{
      [_controller setupDetents];
    }];
  }
}

@end

#endif
