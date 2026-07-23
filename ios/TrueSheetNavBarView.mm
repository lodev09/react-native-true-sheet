//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "TrueSheetNavBarView.h"
#import "TrueSheetNavBarItemView.h"
#import "utils/PlatformUtil.h"

#import <react/renderer/components/TrueSheetSpec/ComponentDescriptors.h>
#import <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>
#import <react/renderer/components/TrueSheetSpec/RCTComponentViewHelpers.h>

#import <React/RCTConversions.h>
#import <React/RCTLog.h>
#import <React/RCTSurfaceTouchHandler.h>

using namespace facebook::react;

@interface TrueSheetNavBarView () <TrueSheetNavBarItemViewDelegate, UISearchBarDelegate>
@end

@implementation TrueSheetNavBarView {
  __weak UINavigationController *_navigationController;
  __weak UIViewController *_contentViewController;

  NSMutableArray<TrueSheetNavBarItemView *> *_items;
  // Item views live outside the React-managed subtree once re-parented into
  // the bar, so each hosts its own touch handler.
  NSMapTable<TrueSheetNavBarItemView *, RCTSurfaceTouchHandler *> *_touchHandlers;
  TrueSheetNavBarItemView *__weak _titleItemView;

  UISearchController *_searchController;
  // Standalone search bar hosted in the navigation row when the row is
  // otherwise empty — a stacked search controller would leave a blank row above
  UISearchBar *_titleSearchBar;
}

#pragma mark - Initialization

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<TrueSheetNavBarViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const TrueSheetNavBarViewProps>();
    _props = defaultProps;

    _items = [NSMutableArray array];
    _touchHandlers = [NSMapTable weakToStrongObjectsMapTable];
  }
  return self;
}

- (const TrueSheetNavBarViewProps &)navBarProps {
  return *std::static_pointer_cast<TrueSheetNavBarViewProps const>(_props);
}

#pragma mark - Attach / Detach

- (void)attachToNavigationController:(UINavigationController *)navigationController
               contentViewController:(UIViewController *)contentViewController {
  _navigationController = navigationController;
  _contentViewController = contentViewController;

  [self applyConfig];
  [self applyBarItems];
  // Attaching while already visible (e.g. remount on reload) — the bar won't
  // pick the config up until it lays out
  [self layoutNavigationBar];
}

- (void)detach {
  UIViewController *contentViewController = _contentViewController;
  if (contentViewController) {
    contentViewController.navigationItem.leftBarButtonItems = nil;
    contentViewController.navigationItem.rightBarButtonItems = nil;
    contentViewController.navigationItem.titleView = nil;
    contentViewController.navigationItem.searchController = nil;
  }

  _navigationController = nil;
  _contentViewController = nil;
}

#pragma mark - Child Component Mounting

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  if (![childComponentView isKindOfClass:[TrueSheetNavBarItemView class]]) {
    RCTLogWarn(@"TrueSheet: NavBar children must be NavBar.Left, NavBar.Right, or NavBar.Title.");
    return;
  }

  TrueSheetNavBarItemView *item = (TrueSheetNavBarItemView *)childComponentView;
  item.delegate = self;
  [_items insertObject:item atIndex:MIN((NSUInteger)index, _items.count)];

  RCTSurfaceTouchHandler *touchHandler = [[RCTSurfaceTouchHandler alloc] init];
  [touchHandler attachToView:item];
  [_touchHandlers setObject:touchHandler forKey:item];

  // Holds the item until the bar re-parents it on attach
  [self addSubview:item];

  [self applyBarItems];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  if (![childComponentView isKindOfClass:[TrueSheetNavBarItemView class]])
    return;

  TrueSheetNavBarItemView *item = (TrueSheetNavBarItemView *)childComponentView;

  RCTSurfaceTouchHandler *touchHandler = [_touchHandlers objectForKey:item];
  [touchHandler detachFromView:item];
  [_touchHandlers removeObjectForKey:item];

  item.delegate = nil;
  [_items removeObject:item];
  [item removeFromSuperview];

  [self applyBarItems];
}

#pragma mark - Props

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps {
  [super updateProps:props oldProps:oldProps];
  [self applyConfig];
  [self layoutNavigationBar];
}

- (void)applyConfig {
  UINavigationController *navigationController = _navigationController;
  UIViewController *contentViewController = _contentViewController;
  if (!navigationController || !contentViewController)
    return;

  const auto &props = [self navBarProps];
  UINavigationBar *navBar = navigationController.navigationBar;
  UINavigationItem *navItem = contentViewController.navigationItem;

  navItem.title = RCTNSStringFromStringNilIfEmpty(props.title);

  navBar.prefersLargeTitles = props.largeTitle;
  navItem.largeTitleDisplayMode =
    props.largeTitle ? UINavigationItemLargeTitleDisplayModeAlways : UINavigationItemLargeTitleDisplayModeNever;

  UIColor *tintColor = RCTUIColorFromSharedColor(props.tintColor);
  navBar.tintColor = tintColor;

  UIColor *titleColor = RCTUIColorFromSharedColor(props.titleColor);
  NSDictionary *titleAttributes = titleColor ? @{NSForegroundColorAttributeName : titleColor} : @{};

  // Standard appearance — shown once content scrolls behind the bar
  UINavigationBarAppearance *standardAppearance = [[UINavigationBarAppearance alloc] init];
  UIColor *barColor = RCTUIColorFromSharedColor(props.barColor);
  if (barColor) {
    [standardAppearance configureWithOpaqueBackground];
    standardAppearance.backgroundColor = barColor;
  } else {
    [standardAppearance configureWithDefaultBackground];
  }
  if (props.separatorHidden) {
    standardAppearance.shadowColor = nil;
  }
  standardAppearance.titleTextAttributes = titleAttributes;
  standardAppearance.largeTitleTextAttributes = titleAttributes;

  // Scroll-edge appearance — transparent at rest so the sheet background shows
  UINavigationBarAppearance *scrollEdgeAppearance = [[UINavigationBarAppearance alloc] init];
  [scrollEdgeAppearance configureWithTransparentBackground];
  scrollEdgeAppearance.titleTextAttributes = titleAttributes;
  scrollEdgeAppearance.largeTitleTextAttributes = titleAttributes;

  navBar.standardAppearance = standardAppearance;
  navBar.compactAppearance = standardAppearance;
  navBar.scrollEdgeAppearance = scrollEdgeAppearance;
  if (@available(iOS 15.0, *)) {
    navBar.compactScrollEdgeAppearance = scrollEdgeAppearance;
  }

  [self applySearch];
}

- (void)applySearch {
  UIViewController *contentViewController = _contentViewController;
  if (!contentViewController)
    return;

  const auto &props = [self navBarProps];
  UINavigationItem *navItem = contentViewController.navigationItem;

  if (!props.searchable) {
    navItem.searchController = nil;
    _searchController = nil;
    _titleSearchBar = nil;
    navItem.titleView = _titleItemView;
    return;
  }

  BOOL stacked = props.searchOptions.searchPlacement == TrueSheetNavBarViewSearchPlacement::Stacked;
  if (stacked && ![self hasNavigationRowContent]) {
    // Nothing else in the navigation row — host the search bar in it directly
    // instead of stacking it below an empty row
    navItem.searchController = nil;
    _searchController = nil;

    if (!_titleSearchBar) {
      _titleSearchBar = [[UISearchBar alloc] init];
      _titleSearchBar.searchBarStyle = UISearchBarStyleMinimal;
      _titleSearchBar.delegate = self;
    }
    [self configureSearchBar:_titleSearchBar];
    navItem.titleView = _titleSearchBar;
    return;
  }

  if (navItem.titleView == _titleSearchBar) {
    navItem.titleView = _titleItemView;
  }
  _titleSearchBar = nil;

  if (!_searchController) {
    _searchController = [[UISearchController alloc] initWithSearchResultsController:nil];
    _searchController.obscuresBackgroundDuringPresentation = NO;
    _searchController.searchBar.delegate = self;
  }
  [self configureSearchBar:_searchController.searchBar];

  if (navItem.searchController != _searchController) {
    navItem.searchController = _searchController;
  }
  navItem.hidesSearchBarWhenScrolling = props.searchOptions.hideWhenScrolling;

  if (@available(iOS 16.0, *)) {
    switch (props.searchOptions.searchPlacement) {
      case TrueSheetNavBarViewSearchPlacement::Inline:
        navItem.preferredSearchBarPlacement = UINavigationItemSearchBarPlacementInline;
        break;
      case TrueSheetNavBarViewSearchPlacement::Stacked:
        navItem.preferredSearchBarPlacement = UINavigationItemSearchBarPlacementStacked;
        break;
      case TrueSheetNavBarViewSearchPlacement::Automatic:
        navItem.preferredSearchBarPlacement = UINavigationItemSearchBarPlacementAutomatic;
        break;
    }
  }

#if RNTS_IPHONE_OS_VERSION_AVAILABLE(26_0)
  if (@available(iOS 26.0, *)) {
    // A stacked search bar can silently vanish when the navigation item is
    // reconfigured repeatedly while toolbar integration is allowed
    // (see react-native-screens #3168)
    navItem.searchBarPlacementAllowsToolbarIntegration = !stacked;
  }
#endif
}

- (void)configureSearchBar:(UISearchBar *)searchBar {
  const auto &props = [self navBarProps];
  searchBar.placeholder = RCTNSStringFromStringNilIfEmpty(props.searchOptions.placeholder);

  NSString *cancelText = RCTNSStringFromStringNilIfEmpty(props.searchOptions.cancelText);
  if (cancelText) {
    [searchBar setValue:cancelText forKey:@"cancelButtonText"];
  }
}

// Whether the navigation row shows anything besides the bar background —
// title text or any bar item
- (BOOL)hasNavigationRowContent {
  const auto &props = [self navBarProps];
  return !props.title.empty() || _items.count > 0;
}

#pragma mark - Bar Items

- (void)applyBarItems {
  UIViewController *contentViewController = _contentViewController;
  if (!contentViewController)
    return;

  NSMutableArray<UIBarButtonItem *> *leftItems = [NSMutableArray array];
  NSMutableArray<UIBarButtonItem *> *rightItems = [NSMutableArray array];
  TrueSheetNavBarItemView *titleItem = nil;

  for (TrueSheetNavBarItemView *item in _items) {
    switch (item.slotType) {
      case TrueSheetNavBarItemViewSlotType::Left:
        [leftItems addObject:item.barButtonItem];
        break;
      case TrueSheetNavBarItemViewSlotType::Right:
        [rightItems addObject:item.barButtonItem];
        break;
      case TrueSheetNavBarItemViewSlotType::Title:
        titleItem = item;
        break;
    }
  }

  UINavigationItem *navItem = contentViewController.navigationItem;
  navItem.leftBarButtonItems = leftItems;
  // UIKit orders right items trailing-to-leading — reverse so children read
  // left-to-right on screen in JSX order
  navItem.rightBarButtonItems = [[rightItems reverseObjectEnumerator] allObjects];
  navItem.titleView = titleItem;
  _titleItemView = titleItem;

  // Items count toward the navigation row — re-evaluate the search placement
  [self applySearch];
  [self layoutNavigationBar];
}

#pragma mark - TrueSheetNavBarItemViewDelegate

- (void)navBarItemViewDidChangeSize:(TrueSheetNavBarItemView *)itemView {
  if (!itemView.needsAutoLayout) {
    itemView.frame = (CGRect){itemView.frame.origin, itemView.contentSize};
  }
  [self layoutNavigationBar];
}

// Forces the bar to lay out — config changes made while the bar is already
// visible don't take effect until it does
- (void)layoutNavigationBar {
  UINavigationController *navigationController = _navigationController;
  if (!navigationController)
    return;

  UINavigationBar *navBar = navigationController.navigationBar;
  if (navBar.window == nil)
    return;

  [navBar setNeedsLayout];
  [navBar layoutIfNeeded];
}

#pragma mark - UISearchBarDelegate

- (const TrueSheetNavBarViewEventEmitter *)navBarEventEmitter {
  if (!_eventEmitter)
    return nullptr;
  return static_cast<const TrueSheetNavBarViewEventEmitter *>(_eventEmitter.get());
}

- (void)searchBar:(UISearchBar *)searchBar textDidChange:(NSString *)searchText {
  if (auto emitter = [self navBarEventEmitter]) {
    TrueSheetNavBarViewEventEmitter::OnSearchChange event;
    event.text = std::string([searchText UTF8String] ?: "");
    emitter->onSearchChange(event);
  }
}

- (void)searchBarSearchButtonClicked:(UISearchBar *)searchBar {
  if (auto emitter = [self navBarEventEmitter]) {
    TrueSheetNavBarViewEventEmitter::OnSearchSubmit event;
    event.text = std::string([searchBar.text UTF8String] ?: "");
    emitter->onSearchSubmit(event);
  }
}

- (void)searchBarTextDidBeginEditing:(UISearchBar *)searchBar {
  // A standalone bar manages its own cancel button — UISearchController
  // handles this for the stacked bar
  if (searchBar == _titleSearchBar) {
    [searchBar setShowsCancelButton:YES animated:YES];
  }

  if (auto emitter = [self navBarEventEmitter]) {
    emitter->onSearchFocus({});
  }
}

- (void)searchBarTextDidEndEditing:(UISearchBar *)searchBar {
  if (searchBar == _titleSearchBar) {
    [searchBar setShowsCancelButton:NO animated:YES];
  }

  if (auto emitter = [self navBarEventEmitter]) {
    emitter->onSearchBlur({});
  }
}

- (void)searchBarCancelButtonClicked:(UISearchBar *)searchBar {
  if (searchBar == _titleSearchBar) {
    searchBar.text = @"";
    [searchBar resignFirstResponder];
  }

  if (auto emitter = [self navBarEventEmitter]) {
    emitter->onSearchCancel({});
  }
}

#pragma mark - Recycling

- (void)prepareForRecycle {
  [super prepareForRecycle];

  [self detach];

  for (TrueSheetNavBarItemView *item in _items) {
    RCTSurfaceTouchHandler *touchHandler = [_touchHandlers objectForKey:item];
    [touchHandler detachFromView:item];
    item.delegate = nil;
  }
  [_touchHandlers removeAllObjects];
  [_items removeAllObjects];

  _titleItemView = nil;
  _searchController = nil;
  _titleSearchBar = nil;
}

@end

Class<RCTComponentViewProtocol> TrueSheetNavBarViewCls(void) {
  return TrueSheetNavBarView.class;
}

#endif  // RCT_NEW_ARCH_ENABLED
