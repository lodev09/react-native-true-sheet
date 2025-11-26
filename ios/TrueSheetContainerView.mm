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
#import "TrueSheetHeaderView.h"

#import <React/RCTConversions.h>
#import <React/RCTLog.h>

using namespace facebook::react;

@interface TrueSheetContainerView () <TrueSheetContentViewDelegate, TrueSheetHeaderViewDelegate>
@end

@implementation TrueSheetContainerView {
  TrueSheetContentView *_contentView;
  TrueSheetHeaderView *_headerView;
  TrueSheetFooterView *_footerView;
  BOOL _scrollViewPinningSet;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<TrueSheetContainerViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const TrueSheetContainerViewProps>();
    _props = defaultProps;

    self.backgroundColor = [UIColor clearColor];

    _contentView = nil;
    _headerView = nil;
    _footerView = nil;
    _scrollViewPinningSet = NO;
  }
  return self;
}

- (void)layoutSubviews {
  [super layoutSubviews];

  // Override Yoga layout - fill the entire parent (controller's view)
  if (self.superview) {
    CGRect parentBounds = self.superview.bounds;
    if (!CGRectEqualToRect(self.frame, parentBounds)) {
      self.frame = parentBounds;
    }
  }
}

- (CGFloat)contentHeight {
  return _contentView ? _contentView.frame.size.height : 0;
}

- (CGFloat)headerHeight {
  return _headerView ? _headerView.frame.size.height : 0;
}

- (void)layoutFooter {
  if (_footerView) {
    // Force footer to reapply constraints on size change
    CGFloat height = _footerView.frame.size.height;
    if (height > 0) {
      [_footerView setupConstraintsWithHeight:height];
    }
  }
}

- (void)setScrollViewPinningEnabled:(BOOL)scrollViewPinningEnabled {
  _scrollViewPinningEnabled = scrollViewPinningEnabled;
  _scrollViewPinningSet = YES;
}

- (void)setupContentScrollViewPinning {
  if (_scrollViewPinningSet && _contentView) {
    [_contentView setupScrollViewPinning:_scrollViewPinningEnabled withHeaderView:_headerView];
  }
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [super mountChildComponentView:childComponentView index:index];

  // Handle content view mounting
  if ([childComponentView isKindOfClass:[TrueSheetContentView class]]) {
    if (_contentView != nil) {
      RCTLogWarn(@"TrueSheet: Container can only have one content component.");
      return;
    }

    _contentView = (TrueSheetContentView *)childComponentView;
    _contentView.delegate = self;
  }

  // Handle header view mounting
  if ([childComponentView isKindOfClass:[TrueSheetHeaderView class]]) {
    if (_headerView != nil) {
      RCTLogWarn(@"TrueSheet: Container can only have one header component.");
      return;
    }

    _headerView = (TrueSheetHeaderView *)childComponentView;
    _headerView.delegate = self;

    // Re-apply scroll view pinning with header
    if (_contentView) {
      [self setupContentScrollViewPinning];
    }

    // Notify initial header size
    [self headerViewDidChangeSize:_headerView.frame.size];
  }

  // Handle footer view mounting
  if ([childComponentView isKindOfClass:[TrueSheetFooterView class]]) {
    if (_footerView != nil) {
      RCTLogWarn(@"TrueSheet: Container can only have one footer component.");
      return;
    }

    _footerView = (TrueSheetFooterView *)childComponentView;
  }
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  if ([childComponentView isKindOfClass:[TrueSheetContentView class]]) {
    _contentView.delegate = nil;
    _contentView = nil;
  }

  if ([childComponentView isKindOfClass:[TrueSheetHeaderView class]]) {
    _headerView.delegate = nil;
    _headerView = nil;

    // Re-apply scroll view pinning without header
    if (_contentView) {
      [self setupContentScrollViewPinning];
    }

    // Notify delegate that header was unmounted (height is now 0)
    [self headerViewDidChangeSize:CGSizeZero];
  }

  if ([childComponentView isKindOfClass:[TrueSheetFooterView class]]) {
    _footerView = nil;
  }

  [super unmountChildComponentView:childComponentView index:index];
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps {
  [super updateProps:props oldProps:oldProps];
}

#pragma mark - TrueSheetContentViewDelegate

- (void)contentViewDidChangeSize:(CGSize)newSize {
  // Forward content size changes to host view for sheet resizing
  if ([self.delegate respondsToSelector:@selector(containerViewContentDidChangeSize:)]) {
    [self.delegate containerViewContentDidChangeSize:newSize];
  }
}

#pragma mark - TrueSheetHeaderViewDelegate

- (void)headerViewDidChangeSize:(CGSize)newSize {
  // Forward header size changes to host view
  if ([self.delegate respondsToSelector:@selector(containerViewHeaderDidChangeSize:)]) {
    [self.delegate containerViewHeaderDidChangeSize:newSize];
  }
}

@end

#endif
