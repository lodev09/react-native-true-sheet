import { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { LegendList } from '@legendapp/list';
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet';

import { DARK, DARK_GRAY, FOOTER_HEIGHT, SPACING, times } from '../../utils';
import { Input } from '../Input';
import { DemoContent } from '../DemoContent';
import { Spacer } from '../Spacer';
import { Header } from '../Header';
import { Footer } from '../Footer';

interface LegendListSheetProps extends TrueSheetProps {}

export const LegendListSheet = forwardRef<TrueSheet, LegendListSheetProps>((props, ref) => {
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
      onDidDismiss={() => console.log('Sheet LegendList dismissed!')}
      onDidPresent={() => console.log(`Sheet LegendList presented!`)}
      footer={<Footer />}
      {...props}
    >
      <View style={styles.wrapper}>
        <LegendList
          data={times(500, (i) => i)}
          estimatedItemSize={60}
          contentContainerStyle={styles.content}
          ItemSeparatorComponent={Spacer as React.ComponentType<{ leadingItem: number }>}
          renderItem={({ item }: { item: number }) => (
            <DemoContent color={DARK_GRAY} text={`Item #${item}`} />
          )}
        />
      </View>
    </TrueSheet>
  );
});

LegendListSheet.displayName = 'LegendListSheet';

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  content: {
    padding: SPACING,
    paddingBottom: FOOTER_HEIGHT + SPACING,
  },
});
