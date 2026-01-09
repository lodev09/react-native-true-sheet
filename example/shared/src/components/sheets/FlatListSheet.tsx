import { forwardRef, useRef } from 'react';
import { StyleSheet, FlatList, View } from 'react-native';
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet';

import { DARK, DARK_GRAY, FOOTER_HEIGHT, SPACING, times } from '../../utils';
import { Input } from '../Input';
import { DemoContent } from '../DemoContent';
import { Spacer } from '../Spacer';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FlatListSheetProps extends TrueSheetProps {}

export const FlatListSheet = forwardRef<TrueSheet, FlatListSheetProps>((props, ref) => {
  const insets = useSafeAreaInsets();
  const testRef = useRef<TrueSheet>(null);
  return (
    <TrueSheet
      ref={ref}
      detents={[0.5, 1]}
      backgroundBlur="dark"
      backgroundColor={DARK}
      scrollable
      header={
        <Header>
          <Input />
        </Header>
      }
      onDidDismiss={() => console.log('Sheet FlatList dismissed!')}
      onDidPresent={() => console.log(`Sheet FlatList presented!`)}
      footer={<Footer onPress={() => testRef.current?.present()} />}
      {...props}
    >
      <View style={styles.wrapper}>
        <FlatList
          nestedScrollEnabled
          data={times(10, (i) => i)}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: FOOTER_HEIGHT + SPACING + insets.bottom },
          ]}
          indicatorStyle="black"
          ItemSeparatorComponent={Spacer}
          renderItem={({ item }) => <DemoContent color={DARK_GRAY} text={`Item #${item}`} />}
        />
      </View>
      <TrueSheet detents={[0.3]} ref={testRef}>
        <DemoContent />
      </TrueSheet>
    </TrueSheet>
  );
});

FlatListSheet.displayName = 'FlatListSheet';

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  content: {
    padding: SPACING,
  },
});
