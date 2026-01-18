//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "TrueSheetContainerView.h"
#import "TrueSheetContentView.h"
#import "TrueSheetFooterView.h"
#import "TrueSheetHeaderView.h"
#import "TrueSheetViewController.h"
#import "core/TrueSheetKeyboardObserver.h"
#import "utils/WindowUtil.h"

#import <react/renderer/components/TrueSheetSpec/ComponentDescriptors.h>
#import <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>
#import <react/renderer/components/TrueSheetSpec/RCTComponentViewHelpers.h>

#import <React/RCTConversions.h>
#import <React/RCTLog.h>

using namespace facebook::react;

@interface TrueSheetContainerView () <TrueSheetContentViewDelegate, TrueSheetHeaderViewDelegate>
@end

@implementation TrueSheetContainerView {
  TrueSheetContentView *_contentView;
  TrueSheetHeaderView *_headerView;
  TrueSheetFooterView *_footerView;
  TrueSheetKeyboardObserver *_keyboardObserver;
  BOOL _scrollViewPinningSet;
}

#pragma mark - Initialization

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

#pragma mark - Layout

- (void)layoutSubviews {
  [super layoutSubviews];
  [_contentView updateScrollViewHeight];
}

- (CGFloat)contentHeight {
  return _contentView ? _contentView.frame.size.height : 0;
}

- (CGFloat)headerHeight {
  return _headerView ? _headerView.frame.size.height : 0;
}

- (void)layoutFooter {
  if (_footerView) {
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

- (void)setScrollableOptions:(NSDictionary *)scrollableOptions {
  _scrollableOptions = scrollableOptions;
  if (scrollableOptions) {
    NSNumber *offset = scrollableOptions[@"keyboardScrollOffset"];
    _contentView.keyboardScrollOffset = offset ? [offset floatValue] : 0;
  } else {
    _contentView.keyboardScrollOffset = 0;
  }
}

- (void)setupContentScrollViewPinning {
  if (_scrollViewPinningSet && _contentView) {
    CGFloat bottomInset = 0;
    if ([_insetAdjustment isEqualToString:@"automatic"]) {
      bottomInset = [WindowUtil keyWindow].safeAreaInsets.bottom;
    }
    [_contentView setupScrollViewPinning:_scrollViewPinningEnabled bottomInset:bottomInset];
  }
}

#pragma mark - Child Component Mounting

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [super mountChildComponentView:childComponentView index:index];

  if ([childComponentView isKindOfClass:[TrueSheetContentView class]]) {
    if (_contentView != nil) {
      RCTLogWarn(@"TrueSheet: Container can only have one content component.");
      return;
    }
    _contentView = (TrueSheetContentView *)childComponentView;
    _contentView.delegate = self;
  }

  if ([childComponentView isKindOfClass:[TrueSheetHeaderView class]]) {
    if (_headerView != nil) {
      RCTLogWarn(@"TrueSheet: Container can only have one header component.");
      return;
    }
    _headerView = (TrueSheetHeaderView *)childComponentView;
    _headerView.delegate = self;
    [self headerViewDidChangeSize:_headerView.frame.size];
  }

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
  [self.delegate containerViewContentDidChangeSize:newSize];
}

- (void)contentViewDidChangeChildren {
  [self setupContentScrollViewPinning];
}

- (void)contentViewDidChangeInsets {
  [self setupContentScrollViewPinning];
}

#pragma mark - TrueSheetHeaderViewDelegate

- (void)headerViewDidChangeSize:(CGSize)newSize {
  [self.delegate containerViewHeaderDidChangeSize:newSize];
}

#pragma mark - Keyboard Observer

- (void)setupKeyboardObserverWithViewController:(UIViewController *)viewController {
  [self cleanupKeyboardObserver];

  _keyboardObserver = [[TrueSheetKeyboardObserver alloc] init];
  _keyboardObserver.viewController = (TrueSheetViewController *)viewController;

  if (_contentView) {
    _contentView.keyboardObserver = _keyboardObserver;
    [_keyboardObserver addDelegate:_contentView];
  }

  if (_footerView) {
    _footerView.keyboardObserver = _keyboardObserver;
    [_keyboardObserver addDelegate:_footerView];
  }

  [_keyboardObserver start];
}

- (void)cleanupKeyboardObserver {
  if (_keyboardObserver) {
    [_keyboardObserver stop];
    _keyboardObserver = nil;
  }

  _contentView.keyboardObserver = nil;
  _footerView.keyboardObserver = nil;
}

@end

Class<RCTComponentViewProtocol> TrueSheetContainerViewCls(void) {
  return TrueSheetContainerView.class;
}

#endif
