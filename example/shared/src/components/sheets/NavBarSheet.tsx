import { forwardRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TrueSheet, TrueSheetNavBar, type TrueSheetProps } from '@lodev09/react-native-true-sheet';

import { BORDER_RADIUS, GAP, LIGHT_GRAY, SPACING, times } from '../../utils';

interface NavBarSheetProps extends TrueSheetProps {}

const ITEMS = times(30, (i) => `Item #${i + 1}`);

export const NavBarSheet = forwardRef<TrueSheet, NavBarSheetProps>((props, ref) => {
  const [query, setQuery] = useState('');

  const items = ITEMS.filter((item) => item.toLowerCase().includes(query.toLowerCase()));

  const dismiss = () => {
    if (typeof ref === 'object' && ref?.current) {
      ref.current.dismiss();
    }
  };

  return (
    <TrueSheet
      ref={ref}
      name="navbar"
      detents={[0.6, 1]}
      style={styles.sheet}
      header={
        <TrueSheetNavBar
          title="Nav Bar"
          largeTitle
          search={{ placeholder: 'Search items' }}
          onSearchChange={(event) => setQuery(event.nativeEvent.text)}
          onSearchCancel={() => setQuery('')}
        >
          <TrueSheetNavBar.Right>
            <Pressable onPress={dismiss} hitSlop={8}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </TrueSheetNavBar.Right>
        </TrueSheetNavBar>
      }
      onDidPresent={() => console.log('NavBar sheet presented!')}
      onDidDismiss={() => console.log('NavBar sheet dismissed!')}
      {...props}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardDismissMode="on-drag">
        {items.map((item) => (
          <View key={item} style={styles.item}>
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
      </ScrollView>
    </TrueSheet>
  );
});

NavBarSheet.displayName = 'NavBarSheet';

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
  },
  content: {
    padding: SPACING,
    gap: GAP,
  },
  doneText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0A84FF',
  },
  item: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: BORDER_RADIUS,
    padding: SPACING,
  },
  itemText: {
    color: LIGHT_GRAY,
  },
});
