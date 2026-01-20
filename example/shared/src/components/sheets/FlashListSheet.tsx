import { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet';

import { DARK, DARK_GRAY, FOOTER_HEIGHT, SPACING, times } from '../../utils';
import { Input } from '../Input';
import { DemoContent } from '../DemoContent';
import { Spacer } from '../Spacer';
import { Header } from '../Header';
import { Footer } from '../Footer';

interface FlashListSheetProps extends TrueSheetProps {}

export const FlashListSheet = forwardRef<TrueSheet, FlashListSheetProps>((props, ref) => {
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
      onDidDismiss={() => console.log('Sheet FlashList dismissed!')}
      onDidPresent={() => console.log(`Sheet FlashList presented!`)}
      footer={<Footer />}
      {...props}
    >
      <View style={styles.wrapper}>
        <FlashList
          data={times(500, (i) => i)}
          contentContainerStyle={styles.content}
          ItemSeparatorComponent={Spacer}
          renderItem={({ item }: { item: number }) => (
            <DemoContent color={DARK_GRAY} text={`Item #${item}`} />
          )}
        />
      </View>
    </TrueSheet>
  );
});

FlashListSheet.displayName = 'FlashListSheet';

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  content: {
    padding: SPACING,
    paddingBottom: FOOTER_HEIGHT + SPACING,
  },
});
