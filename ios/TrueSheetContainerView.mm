//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "TrueSheetContainerView.h"
#import <React/RCTScrollViewComponentView.h>
#import "TrueSheetContentView.h"
#import "TrueSheetFooterView.h"
#import "TrueSheetHeaderView.h"
#import "TrueSheetViewController.h"
#import "core/TrueSheetKeyboardObserver.h"
#import "utils/UIView+ScrollEdgeInteraction.h"
#import "utils/WindowUtil.h"

#import <react/renderer/components/TrueSheetSpec/ComponentDescriptors.h>
#import <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>
#import <react/renderer/components/TrueSheetSpec/RCTComponentViewHelpers.h>

#import <React/RCTConversions.h>
#import <React/RCTLog.h>
#import <react/renderer/core/LayoutMetrics.h>

using namespace facebook::react;

@implementation ScrollableOptions

- (instancetype)init {
  if (self = [super init]) {
    _keyboardScrollOffset = 0;
    _scrollingExpandsSheet = YES;
    _topScrollEdgeEffect = TrueSheetViewTopScrollEdgeEffect::Hidden;
    _bottomScrollEdgeEffect = TrueSheetViewBottomScrollEdgeEffect::Hidden;
  }
  return self;
}

@end

@interface TrueSheetContainerView () <TrueSheetContentViewDelegate,
  TrueSheetHeaderViewDelegate,
  TrueSheetFooterViewDelegate>
@end

@implementation TrueSheetContainerView {
  TrueSheetContentView *_contentView;
  TrueSheetHeaderView *_headerView;
  TrueSheetFooterView *_footerView;
  TrueSheetKeyboardObserver *_keyboardObserver;
  BOOL _scrollableSet;
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
    _scrollableSet = NO;
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

- (CGFloat)footerHeight {
  return _footerView ? _footerView.frame.size.height : 0;
}

- (void)layoutFooter {
  if (_footerView) {
    CGFloat height = _footerView.frame.size.height;
    if (height > 0) {
      [_footerView setupConstraintsWithHeight:height];
    }
  }
}

- (void)setScrollableEnabled:(BOOL)scrollableEnabled {
  _scrollableEnabled = scrollableEnabled;
  _scrollableSet = YES;
}

- (void)setScrollableOptions:(ScrollableOptions *)scrollableOptions {
  _scrollableOptions = scrollableOptions;
  _contentView.keyboardScrollOffset = scrollableOptions ? scrollableOptions.keyboardScrollOffset : 0;
}

- (void)setupScrollable {
  if (_scrollableSet && _contentView) {
    CGFloat bottomInset = 0;
    if (_insetAdjustment == TrueSheetViewInsetAdjustment::Automatic) {
      bottomInset = [WindowUtil keyWindow].safeAreaInsets.bottom;
    }
    [_contentView setupScrollable:_scrollableEnabled bottomInset:bottomInset];
    [_contentView applyScrollEdgeEffects:_scrollableOptions];
    if (@available(iOS 26.0, *)) {
      [self setupEdgeInteractions];
    }
  }
}

- (void)setupEdgeInteractions API_AVAILABLE(ios(26.0)) {
  if (!_contentView) {
    return;
  }

  auto topEffect =
    _scrollableOptions ? _scrollableOptions.topScrollEdgeEffect : TrueSheetViewTopScrollEdgeEffect::Hidden;
  auto bottomEffect = _scrollableOptions ? _scrollableOptions.bottomScrollEdgeEffect
                                         : TrueSheetViewBottomScrollEdgeEffect::Hidden;

  BOOL topHidden = topEffect == TrueSheetViewTopScrollEdgeEffect::Hidden;
  BOOL bottomHidden = bottomEffect == TrueSheetViewBottomScrollEdgeEffect::Hidden;

  RCTScrollViewComponentView *scrollViewComponent = [_contentView findScrollView];
  UIScrollView *scrollView = scrollViewComponent.scrollView;

  if (_headerView) {
    [_headerView setupEdgeInteractionWithScrollView:topHidden ? nil : scrollView edge:UIRectEdgeTop];
  }
  if (_footerView) {
    [_footerView setupEdgeInteractionWithScrollView:bottomHidden ? nil : scrollView edge:UIRectEdgeBottom];
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
    _footerView.delegate = self;
    [self footerViewDidChangeSize:_footerView.frame.size];
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
    [self footerViewDidChangeSize:CGSizeZero];
    _footerView.delegate = nil;
    _footerView = nil;
  }

  [super unmountChildComponentView:childComponentView index:index];
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps {
  [super updateProps:props oldProps:oldProps];
}

#pragma clang diagnostic ignored "-Wobjc-missing-super-calls"
- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics {
  // Intentionally skip super - AutoLayout handles container's frame, not Yoga
}

#pragma mark - TrueSheetContentViewDelegate

- (void)contentViewDidChangeSize:(CGSize)newSize {
  [self.delegate containerViewContentDidChangeSize:newSize];
}

- (void)contentViewScrollViewDidChange {
  [self.delegate containerViewScrollViewDidChange];
}

#pragma mark - TrueSheetHeaderViewDelegate

- (void)headerViewDidChangeSize:(CGSize)newSize {
  [self.delegate containerViewHeaderDidChangeSize:newSize];
  if (@available(iOS 26.0, *)) {
    [self setupEdgeInteractions];
  }
}

#pragma mark - TrueSheetFooterViewDelegate

- (void)footerViewDidChangeSize:(CGSize)newSize {
  if ([self.delegate respondsToSelector:@selector(containerViewFooterDidChangeSize:)]) {
    [self.delegate containerViewFooterDidChangeSize:newSize];
  }
  if (@available(iOS 26.0, *)) {
    [self setupEdgeInteractions];
  }
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
