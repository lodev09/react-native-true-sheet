import { StyleSheet, type ViewProps } from 'react-native';

import type { TrueSheetNavBarProps } from './TrueSheet.types';
import TrueSheetNavBarViewNativeComponent from './fabric/TrueSheetNavBarViewNativeComponent';
import TrueSheetNavBarItemViewNativeComponent from './fabric/TrueSheetNavBarItemViewNativeComponent';

const NavBarLeft = ({ style, ...rest }: ViewProps) => (
  <TrueSheetNavBarItemViewNativeComponent slotType="left" style={[styles.item, style]} {...rest} />
);

const NavBarRight = ({ style, ...rest }: ViewProps) => (
  <TrueSheetNavBarItemViewNativeComponent slotType="right" style={[styles.item, style]} {...rest} />
);

const NavBarTitle = ({ style, ...rest }: ViewProps) => (
  <TrueSheetNavBarItemViewNativeComponent slotType="title" style={[styles.item, style]} {...rest} />
);

const NavBar = (props: TrueSheetNavBarProps) => {
  const {
    title,
    largeTitle,
    tintColor,
    titleColor,
    backgroundColor,
    separatorHidden,
    search,
    onSearchChange,
    onSearchSubmit,
    onSearchFocus,
    onSearchBlur,
    onSearchCancel,
    children,
  } = props;

  const searchOptions = typeof search === 'object' ? search : undefined;

  return (
    <TrueSheetNavBarViewNativeComponent
      style={styles.navBar}
      pointerEvents="box-none"
      title={title}
      largeTitle={largeTitle}
      tintColor={tintColor}
      titleColor={titleColor}
      barColor={backgroundColor}
      separatorHidden={separatorHidden}
      searchable={!!search}
      searchOptions={{
        placeholder: searchOptions?.placeholder,
        cancelText: searchOptions?.cancelText,
        hideWhenScrolling: searchOptions?.hideWhenScrolling,
        searchPlacement: searchOptions?.placement,
      }}
      onSearchChange={onSearchChange}
      onSearchSubmit={onSearchSubmit}
      onSearchFocus={onSearchFocus}
      onSearchBlur={onSearchBlur}
      onSearchCancel={onSearchCancel}
    >
      {children}
    </TrueSheetNavBarViewNativeComponent>
  );
};

/**
 * Native navigation bar for the sheet. Pass it to the sheet's `header` prop.
 * Backed by `UINavigationController` on iOS — supports large titles,
 * scroll-edge appearance, bar items, and a native search field.
 *
 * ```tsx
 * <TrueSheet
 *   header={
 *     <TrueSheetNavBar title="Details" largeTitle search>
 *       <TrueSheetNavBar.Left><BackButton /></TrueSheetNavBar.Left>
 *       <TrueSheetNavBar.Right><DoneButton /></TrueSheetNavBar.Right>
 *     </TrueSheetNavBar>
 *   }
 * >
 * ```
 */
export const TrueSheetNavBar = Object.assign(NavBar, {
  Left: NavBarLeft,
  Right: NavBarRight,
  Title: NavBarTitle,
});

const styles = StyleSheet.create({
  // Invisible config view — bar items are re-parented into the native bar.
  // Spans the container width so item slots measure against the bar's width.
  navBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0,
    overflow: 'visible',
    zIndex: 1,
  },
  // Sized by its children — the native side drives its placement in the bar
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
});
