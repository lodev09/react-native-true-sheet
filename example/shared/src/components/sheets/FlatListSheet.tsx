import { forwardRef, useRef } from 'react';
import { StyleSheet, FlatList, View, Platform } from 'react-native';
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet';

import { DARK, DARK_GRAY, FOOTER_HEIGHT, HEADER_HEIGHT, SPACING, times } from '../../utils';
import { DemoContent } from '../DemoContent';
import { Spacer } from '../Spacer';
import { Header } from '../Header';
import { Footer } from '../Footer';

interface FlatListSheetProps extends TrueSheetProps {}

export const FlatListSheet = forwardRef<TrueSheet, FlatListSheetProps>((props, ref) => {
  const testRef = useRef<TrueSheet>(null);
  const scrollRef = useRef<FlatList>(null);

  return (
    <TrueSheet
      ref={ref}
      detents={[0.5, 1]}
      backgroundBlur="dark"
      backgroundColor={DARK}
      scrollable
      scrollableOptions={{
        bottomScrollEdgeEffect: 'soft',
        topScrollEdgeEffect: 'soft',
      }}
      header={<Header />}
      headerStyle={styles.header}
      onDidDismiss={() => console.log('Sheet FlatList dismissed!')}
      onDidPresent={() => console.log(`Sheet FlatList presented!`)}
      footer={
        <Footer
          text="OPEN BLANK SHEET"
          wrapperStyle={styles.footer}
          onPress={() => testRef.current?.present()}
        />
      }
      {...props}
    >
      <View style={styles.wrapper}>
        <FlatList
          ref={scrollRef}
          data={times(10, (i) => i)}
          contentContainerStyle={styles.content}
          indicatorStyle="black"
          ItemSeparatorComponent={Spacer}
          scrollIndicatorInsets={{ bottom: FOOTER_HEIGHT }}
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
  footer: {
    backgroundColor: Platform.select({
      default: DARK_GRAY,
      ios: undefined,
    }),
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
  },
  content: {
    padding: SPACING,
    paddingTop: HEADER_HEIGHT,
    paddingBottom: FOOTER_HEIGHT + SPACING,
  },
});
