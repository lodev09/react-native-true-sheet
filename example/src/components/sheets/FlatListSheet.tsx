import { forwardRef, type Ref } from 'react';
import { StyleSheet, FlatList, View } from 'react-native';
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet';

import { DARK, DARK_GRAY, SPACING, times } from '../../utils';
import { Input } from '../Input';
import { DemoContent } from '../DemoContent';
import { Spacer } from '../Spacer';
import { Header } from '../Header';

interface FlatListSheetProps extends TrueSheetProps {}

export const FlatListSheet = forwardRef((props: FlatListSheetProps, ref: Ref<TrueSheet>) => {
  return (
    <TrueSheet
      ref={ref}
      detents={[0.5, 1]}
      blurTint="dark"
      backgroundColor={DARK}
      keyboardMode="pan"
      edgeToEdgeFullScreen
      scrollable
      header={
        <Header>
          <Input />
        </Header>
      }
      onDidDismiss={() => console.log('Sheet FlatList dismissed!')}
      onDidPresent={() => console.log(`Sheet FlatList presented!`)}
      {...props}
    >
      <View style={styles.wrapper}>
        <FlatList
          nestedScrollEnabled
          data={times(10, (i) => i)}
          contentContainerStyle={styles.content}
          indicatorStyle="black"
          ItemSeparatorComponent={Spacer}
          renderItem={({ item }) => <DemoContent color={DARK_GRAY} text={`Item #${item}`} />}
        />
      </View>
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
    paddingTop: SPACING,
  },
});
