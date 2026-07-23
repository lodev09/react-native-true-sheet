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

  UISearchController *_searchController;
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
}

- (void)detach {
  UIViewController *contentViewController = _contentViewController;
  if (contentViewController) {
    contentViewController.navigationItem.leftBarButtonItems = nil;
    contentViewController.navigationItem.rightBarButtonItems = nil;
    contentViewController.navigationItem.titleView = nil;
    contentViewController.navigationItem.searchController = nil;
  }

  for (TrueSheetNavBarItemView *item in _items) {
    [self addSubview:item];
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
    return;
  }

  if (!_searchController) {
    _searchController = [[UISearchController alloc] initWithSearchResultsController:nil];
    _searchController.obscuresBackgroundDuringPresentation = NO;
    _searchController.searchBar.delegate = self;
  }

  UISearchBar *searchBar = _searchController.searchBar;
  searchBar.placeholder = RCTNSStringFromStringNilIfEmpty(props.searchOptions.placeholder);

  NSString *cancelText = RCTNSStringFromStringNilIfEmpty(props.searchOptions.cancelText);
  if (cancelText) {
    [searchBar setValue:cancelText forKey:@"cancelButtonText"];
  }

  navItem.searchController = _searchController;
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
        [leftItems addObject:[[UIBarButtonItem alloc] initWithCustomView:item]];
        break;
      case TrueSheetNavBarItemViewSlotType::Right:
        [rightItems addObject:[[UIBarButtonItem alloc] initWithCustomView:item]];
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
}

#pragma mark - TrueSheetNavBarItemViewDelegate

- (void)navBarItemViewDidChangeSize:(TrueSheetNavBarItemView *)itemView {
  UINavigationController *navigationController = _navigationController;
  if (!navigationController)
    return;

  itemView.frame = (CGRect){itemView.frame.origin, itemView.contentSize};
  [navigationController.navigationBar setNeedsLayout];
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
  if (auto emitter = [self navBarEventEmitter]) {
    emitter->onSearchFocus({});
  }
}

- (void)searchBarTextDidEndEditing:(UISearchBar *)searchBar {
  if (auto emitter = [self navBarEventEmitter]) {
    emitter->onSearchBlur({});
  }
}

- (void)searchBarCancelButtonClicked:(UISearchBar *)searchBar {
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

  _searchController = nil;
}

@end

Class<RCTComponentViewProtocol> TrueSheetNavBarViewCls(void) {
  return TrueSheetNavBarView.class;
}

#endif  // RCT_NEW_ARCH_ENABLED
