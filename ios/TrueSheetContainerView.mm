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

@interface TrueSheetContainerView () <TrueSheetContentViewDelegate>
@end

@implementation TrueSheetContainerView {
  __weak TrueSheetView *_sheetView;
  TrueSheetContentView *_contentView;
  TrueSheetFooterView *_footerView;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<TrueSheetContainerViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const TrueSheetContainerViewProps>();
    _props = defaultProps;

    // Set background color to clear by default
    self.backgroundColor = [UIColor clearColor];

    _sheetView = nil;
    _contentView = nil;
    _footerView = nil;
  }
  return self;
}

- (void)dealloc {
}

- (void)setupInSheetView:(TrueSheetView *)sheetView {
  // Store reference to sheet view
  _sheetView = sheetView;

  // Get the controller's view as the parent view
  UIView *parentView = _sheetView.controller.view;

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
      _sheetView.controller.contentHeight = @(_contentView.frame.size.height);
    }

    // Setup content view with controller
    [_contentView setupWithController:_sheetView.controller];
  }

  if ([childComponentView isKindOfClass:[TrueSheetFooterView class]]) {
    if (_footerView != nil) {
      NSLog(@"TrueSheet: Container can only have one footer component.");
      return;
    }

    _footerView = (TrueSheetFooterView *)childComponentView;

    // Setup footer view with controller
    [_footerView setupWithController:_sheetView.controller];
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
}

#pragma mark - TrueSheetContentViewDelegate

- (void)contentViewDidChangeSize:(CGSize)newSize {
  TrueSheetViewController *controller = _sheetView.controller;

  // Update controller's content height
  controller.contentHeight = @(newSize.height);

  // Update detents if sheet is already presented
  if (_sheetView.isPresented) {
    // Tell controller that we are transitioning from layout changes.
    // Controller viewDidLayoutSubviews will handle position notification.
    controller.layoutTransitioning = YES;

    [controller.sheetPresentationController animateChanges:^{
      [controller setupDetents];
    }];
  }
}

@end

#endif
