import { Children, isValidElement, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type ViewProps } from 'react-native';

import type {
  SearchBlurEvent,
  SearchChangeEvent,
  SearchFocusEvent,
  SearchSubmitEvent,
  TrueSheetNavBarProps,
} from './TrueSheet.types';

const NavBarLeft = ({ children, style, ...rest }: ViewProps) => (
  <View style={[styles.item, style]} {...rest}>
    {children}
  </View>
);

const NavBarRight = ({ children, style, ...rest }: ViewProps) => (
  <View style={[styles.item, style]} {...rest}>
    {children}
  </View>
);

const NavBarTitle = ({ children, style, ...rest }: ViewProps) => (
  <View style={[styles.item, style]} {...rest}>
    {children}
  </View>
);

const NavBar = (props: TrueSheetNavBarProps) => {
  const {
    title,
    largeTitle,
    titleColor,
    backgroundColor,
    separatorHidden,
    search,
    onSearchChange,
    onSearchSubmit,
    onSearchFocus,
    onSearchBlur,
    children,
  } = props;

  const searchOptions = typeof search === 'object' ? search : undefined;

  let left: ReactNode = null;
  let right: ReactNode = null;
  let titleSlot: ReactNode = null;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === NavBarLeft) left = child;
    if (child.type === NavBarRight) right = child;
    if (child.type === NavBarTitle) titleSlot = child;
  });

  return (
    <View
      style={[
        styles.bar,
        !separatorHidden && styles.separator,
        backgroundColor != null && { backgroundColor },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.side}>{left}</View>
        <View style={styles.center}>
          {titleSlot ??
            (!largeTitle && title != null && (
              <Text
                numberOfLines={1}
                style={[styles.title, titleColor != null && { color: titleColor }]}
              >
                {title}
              </Text>
            ))}
        </View>
        <View style={[styles.side, styles.sideRight]}>{right}</View>
      </View>
      {largeTitle && !titleSlot && title != null && (
        <Text
          numberOfLines={1}
          style={[styles.largeTitle, titleColor != null && { color: titleColor }]}
        >
          {title}
        </Text>
      )}
      {!!search && (
        <TextInput
          style={styles.search}
          placeholder={searchOptions?.placeholder ?? 'Search'}
          onChangeText={(text) => onSearchChange?.({ nativeEvent: { text } } as SearchChangeEvent)}
          onSubmitEditing={(event) =>
            onSearchSubmit?.({
              nativeEvent: { text: event.nativeEvent.text },
            } as SearchSubmitEvent)
          }
          onFocus={() => onSearchFocus?.({ nativeEvent: null } as SearchFocusEvent)}
          onBlur={() => onSearchBlur?.({ nativeEvent: null } as SearchBlurEvent)}
        />
      )}
    </View>
  );
};

/**
 * Web implementation of `TrueSheetNavBar`.
 * Renders a styled header bar matching the native API.
 */
export const TrueSheetNavBar = Object.assign(NavBar, {
  Left: NavBarLeft,
  Right: NavBarRight,
  Title: NavBarTitle,
});

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  separator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.2)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  sideRight: {
    justifyContent: 'flex-end',
  },
  center: {
    flex: 2,
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
  },
  search: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 17,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
});
