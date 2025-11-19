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

#import <React/RCTConversions.h>

using namespace facebook::react;

@interface TrueSheetContainerView () <TrueSheetContentViewDelegate>
@end

@implementation TrueSheetContainerView {
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

    _contentView = nil;
    _footerView = nil;
  }
  return self;
}

- (void)dealloc {
}

- (CGFloat)contentHeight {
  return _contentView ? _contentView.frame.size.height : 0;
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

    // Setup content view
    [_contentView setup];
  }

  if ([childComponentView isKindOfClass:[TrueSheetFooterView class]]) {
    if (_footerView != nil) {
      NSLog(@"TrueSheet: Container can only have one footer component.");
      return;
    }

    _footerView = (TrueSheetFooterView *)childComponentView;

    // Setup footer view
    [_footerView setup];
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
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps {
  [super updateProps:props oldProps:oldProps];
}

#pragma mark - TrueSheetContentViewDelegate

- (void)contentViewDidChangeSize:(CGSize)newSize {
  // Notify delegate of size change
  if ([self.delegate respondsToSelector:@selector(containerViewContentDidChangeSize:)]) {
    [self.delegate containerViewContentDidChangeSize:newSize];
  }
}

@end

#endif
