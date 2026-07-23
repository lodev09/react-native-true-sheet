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
#import "TrueSheetNavBarView.h"
#import "TrueSheetPeekView.h"
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
  TrueSheetFooterViewDelegate,
  TrueSheetPeekViewDelegate>
@end

@implementation TrueSheetContainerView {
  TrueSheetContentView *_contentView;
  TrueSheetHeaderView *_headerView;
  TrueSheetFooterView *_footerView;
  TrueSheetPeekView *__weak _peekView;
  TrueSheetNavBarView *__weak _navBarView;
  TrueSheetKeyboardObserver *_keyboardObserver;
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
    self.isAccessibilityElement = NO;
  }
  return self;
}

#pragma mark - Accessibility

- (NSArray *)accessibilityElements {
  NSMutableArray *elements = [NSMutableArray array];
  if (_headerView) {
    [elements addObject:_headerView];
  }
  if (_contentView) {
    [elements addObject:_contentView];
  }
  if (_footerView) {
    // Footer hosts are layout containers; expose their children when present so
    // VoiceOver and XCTest can target the actual footer controls.
    NSArray *footerElements = _footerView.accessibilityElements;
    if (footerElements.count > 0) {
      [elements addObjectsFromArray:footerElements];
    } else {
      [elements addObject:_footerView];
    }
  }
  return elements;
}

- (BOOL)hasAccessibilityFooterElements {
  return _footerView && _footerView.accessibilityElements.count > 0;
}

#pragma mark - Layout

- (CGFloat)contentHeight {
  return _contentView ? _contentView.naturalHeight : 0;
}

- (CGFloat)headerHeight {
  return _headerView ? _headerView.frame.size.height : 0;
}

- (CGFloat)footerHeight {
  return _footerView ? _footerView.frame.size.height : 0;
}

// Distance from the top of the content view to the bottom of the peek view.
// Includes the peek view's offset within the content (padding, views above it)
// so the peek detent reveals everything down to the peek content's bottom edge.
- (CGFloat)peekContentHeight {
  if (!_peekView) {
    return 0;
  }

  if (!_contentView || ![_peekView isDescendantOfView:_contentView]) {
    return _peekView.frame.size.height;
  }

  return CGRectGetMaxY([_peekView convertRect:_peekView.bounds toView:_contentView]);
}

- (void)updateFooterKeyboardOffset {
  [_footerView applyKeyboardOffset];
}

- (void)setFooterBottomInset:(CGFloat)footerBottomInset {
  _footerBottomInset = footerBottomInset;
  [_footerView setBottomInset:footerBottomInset];
}

- (void)setScrollableOptions:(ScrollableOptions *)scrollableOptions {
  _scrollableOptions = scrollableOptions;
  _contentView.keyboardScrollOffset = scrollableOptions ? scrollableOptions.keyboardScrollOffset : 0;
}

- (void)setupScrollable {
  if (_contentView) {
    CGFloat bottomInset = 0;
    if (_insetAdjustment == TrueSheetViewInsetAdjustment::Automatic) {
      bottomInset = [WindowUtil keyWindow].safeAreaInsets.bottom;
    }
    _contentView.hasAutoDetent = _hasAutoDetent;
    [_contentView setupScrollableWithBottomInset:bottomInset];
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
  auto bottomEffect =
    _scrollableOptions ? _scrollableOptions.bottomScrollEdgeEffect : TrueSheetViewBottomScrollEdgeEffect::Hidden;

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
    _contentView.footerView = _footerView;

    // Children mount bottom-up, so the content subtree is complete here.
    // Late-mounted peek views attach themselves instead (see TrueSheetPeekView).
    TrueSheetPeekView *peekView = [self findPeekViewIn:_contentView];
    if (peekView) {
      [self attachPeekView:peekView];
    }
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
    _contentView.footerView = _footerView;
    [_footerView setBottomInset:_footerBottomInset];
    [self footerViewDidChangeSize:_footerView.frame.size];
  }

  if ([childComponentView isKindOfClass:[TrueSheetNavBarView class]]) {
    if (_navBarView != nil && _navBarView != childComponentView) {
      // A remount (e.g. reload) can insert the replacement before the old
      // config unmounts — hand over instead of dropping the new one
      [_navBarView detach];
    }
    _navBarView = (TrueSheetNavBarView *)childComponentView;
    if ([self.delegate respondsToSelector:@selector(containerViewNavBarDidChange)]) {
      [self.delegate containerViewNavBarDidChange];
    }
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
    _footerView.delegate = nil;
    _footerView = nil;
    _contentView.footerView = nil;
    [self footerViewDidChangeSize:CGSizeZero];
  }

  if ([childComponentView isKindOfClass:[TrueSheetNavBarView class]] && _navBarView == childComponentView) {
    [_navBarView detach];
    _navBarView = nil;
    if ([self.delegate respondsToSelector:@selector(containerViewNavBarDidChange)]) {
      [self.delegate containerViewNavBarDidChange];
    }
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
  [self.delegate containerViewFooterDidChangeSize:newSize];
  if (@available(iOS 26.0, *)) {
    [self setupEdgeInteractions];
  }
}

#pragma mark - TrueSheetPeekViewDelegate

- (nullable TrueSheetPeekView *)findPeekViewIn:(UIView *)view {
  if ([view isKindOfClass:[TrueSheetPeekView class]]) {
    return (TrueSheetPeekView *)view;
  }

  for (UIView *subview in view.subviews) {
    TrueSheetPeekView *found = [self findPeekViewIn:subview];
    if (found) {
      return found;
    }
  }

  return nil;
}

- (void)attachPeekView:(TrueSheetPeekView *)peekView {
  if (_peekView == peekView) {
    return;
  }

  if (_peekView != nil) {
    RCTLogWarn(@"TrueSheet: Sheet can only have one peek component.");
    return;
  }

  _peekView = peekView;
  peekView.delegate = self;
  [self peekViewDidChangeSize:peekView.frame.size];
}

- (void)peekViewDidChangeSize:(CGSize)newSize {
  [self.delegate containerViewPeekDidChangeSize:newSize];
}

- (void)peekViewWillDetach:(TrueSheetPeekView *)peekView {
  if (_peekView != peekView) {
    return;
  }

  _peekView.delegate = nil;
  _peekView = nil;
  [self peekViewDidChangeSize:CGSizeZero];
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
