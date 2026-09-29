import { forwardRef, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet';

import { DARK, SPACING, times } from '../../utils';
import { DemoContent } from '../DemoContent';
import { Input } from '../Input';
import { Spacer } from '../Spacer';

interface SearchListSheetProps extends TrueSheetProps {}

export const SearchListSheet = forwardRef<TrueSheet, SearchListSheetProps>((props, ref) => {
  const listRef = useRef<FlatList>(null);
  const [query, setQuery] = useState('');

  return (
    <TrueSheet
      ref={ref}
      detents={[1]}
      name="search-list"
      style={styles.sheet}
      scrollableRef={listRef}
      backgroundColor={DARK}
      onDidDismiss={() => console.log('Sheet SearchList dismissed!')}
      {...props}
    >
      <View style={styles.search}>
        <Input value={query} onChangeText={setQuery} placeholder="Search..." />
      </View>
      <FlatList
        ref={listRef}
        style={styles.list}
        data={times(40, (i) => i)}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={Spacer}
        renderItem={({ item }) => (
          <DemoContent color={`hsl(${(item * 47) % 360}, 60%, 40%)`} text={`Item ${item + 1}`} />
        )}
      />
    </TrueSheet>
  );
});

SearchListSheet.displayName = 'SearchListSheet';

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    paddingTop: SPACING * 2,
  },
  search: {
    paddingHorizontal: SPACING,
    paddingBottom: SPACING,
  },
  list: {
    flex: 1,
  },
  content: {
    padding: SPACING,
  },
});
