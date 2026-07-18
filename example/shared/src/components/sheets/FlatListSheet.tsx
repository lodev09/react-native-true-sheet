import { forwardRef, useRef, useState } from 'react';
import { StyleSheet, FlatList, View, Platform } from 'react-native';
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet';

import { DARK, DARK_GRAY, FOOTER_HEIGHT, HEADER_HEIGHT, SPACING, times } from '../../utils';
import { DemoContent } from '../DemoContent';
import { Spacer } from '../Spacer';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';

interface FlatListSheetProps extends TrueSheetProps {}

export const FlatListSheet = forwardRef<TrueSheet, FlatListSheetProps>((props, ref) => {
  const testRef = useRef<TrueSheet>(null);
  const scrollRef = useRef<FlatList>(null);
  const [itemCount, setItemCount] = useState(3);

  return (
    <TrueSheet
      ref={ref}
      detents={['auto']}
      backgroundBlur="dark"
      backgroundColor={DARK}
      scrollableOptions={{
        bottomScrollEdgeEffect: 'soft',
        topScrollEdgeEffect: 'soft',
      }}
      header={<Header />}
      headerOptions={{ position: 'absolute' }}
      onDidDismiss={() => console.log('Sheet FlatList dismissed!')}
      onDidPresent={() => console.log(`Sheet FlatList presented!`)}
      footer={
        <Footer
          absolute
          text="OPEN BLANK SHEET"
          wrapperStyle={styles.footer}
          onPress={() => testRef.current?.present()}
        />
      }
      footerOptions={{ position: 'absolute' }}
      {...props}
    >
      <View style={styles.wrapper}>
        <FlatList
          ref={scrollRef}
          data={times(itemCount, (i) => i)}
          contentContainerStyle={styles.content}
          indicatorStyle="black"
          ItemSeparatorComponent={Spacer}
          renderItem={({ item }) => <DemoContent color={DARK_GRAY} text={`Item #${item}`} />}
          ListFooterComponent={
            <>
              <Spacer />
              <ButtonGroup>
                <Button text="Add Item" onPress={() => setItemCount((count) => count + 1)} />
                <Button
                  text="Remove Item"
                  onPress={() => setItemCount((count) => Math.max(0, count - 1))}
                />
              </ButtonGroup>
            </>
          }
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
  footer: {
    backgroundColor: Platform.select({
      default: DARK_GRAY,
      ios: undefined,
    }),
  },
  content: {
    padding: SPACING,
    paddingTop: HEADER_HEIGHT + SPACING,
    paddingBottom: FOOTER_HEIGHT + SPACING,
  },
});
