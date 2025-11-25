import { forwardRef, type Ref } from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet';

import { DARK, DARK_GRAY, SPACING, times } from '../../utils';
import { Input } from '../Input';
import { DemoContent } from '../DemoContent';
import { Spacer } from '../Spacer';
import { Header } from '../Header';

interface FlatListSheetProps extends TrueSheetProps {}

export const FlatListSheet = forwardRef((props: FlatListSheetProps, ref: Ref<TrueSheet>) => {
  // const handleRefresh = () => {
  //   setIsRefreshing(true);
  //   setTimeout(() => {
  //     setIsRefreshing(false);
  //   }, 5000);
  // };

  return (
    <TrueSheet
      ref={ref}
      detents={[0.5, 1]}
      blurTint="dark"
      backgroundColor={DARK}
      keyboardMode="pan"
      fitScrollView
      onDidDismiss={() => console.log('Sheet FlatList dismissed!')}
      onDidPresent={() => console.log(`Sheet FlatList presented!`)}
      {...props}
    >
      <Header>
        <Input />
      </Header>
      <FlatList
        nestedScrollEnabled
        data={times(50, (i) => i)}
        contentContainerStyle={styles.content}
        indicatorStyle="black"
        ItemSeparatorComponent={Spacer}
        // scrollIndicatorInsets={{ top: TOP_INSET }}
        // Broken on Android ;(
        // refreshControl={
        //   <RefreshControl
        //     refreshing={isRefreshing}
        //     tintColor="white"
        //     onRefresh={handleRefresh}
        //   />
        // }
        renderItem={() => <DemoContent color={DARK_GRAY} />}
      />
    </TrueSheet>
  );
});

FlatListSheet.displayName = 'FlatListSheet';

const styles = StyleSheet.create({
  content: {
    padding: SPACING,
    paddingTop: SPACING * 2,
  },
});
