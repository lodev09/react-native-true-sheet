import { forwardRef, useRef, useState } from 'react';
import { StyleSheet, FlatList, Platform, View, Text } from 'react-native';
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet';

import {
  BORDER_RADIUS,
  DARK,
  DARK_GRAY,
  FOOTER_HEIGHT,
  GAP,
  GRAY,
  HEADER_HEIGHT,
  LIGHT_GRAY,
  SPACING,
  times,
} from '../../utils';
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
  const [showList, setShowList] = useState(true);

  const toggleButton = (
    <Button
      text={showList ? 'Switch to View' : 'Switch to List'}
      onPress={() => setShowList((show) => !show)}
    />
  );

  return (
    <TrueSheet
      ref={ref}
      detents={['auto']}
      backgroundBlur="dark"
      backgroundColor={DARK}
      scrollableRef={scrollRef}
      scrollableOptions={{
        bottomScrollEdgeEffect: 'soft',
        topScrollEdgeEffect: 'soft',
      }}
      header={<Header />}
      headerOptions={{ position: 'absolute' }}
      onDidDismiss={() => console.log('Sheet FlatList dismissed!')}
      onDidPresent={() => console.log(`Sheet FlatList presented!`)}
      footer={<Footer text="OPEN BLANK SHEET" onPress={() => testRef.current?.present()} />}
      footerStyle={styles.footer}
      footerOptions={{ position: 'absolute' }}
      {...props}
    >
      {showList ? (
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
              <Spacer />
              {toggleButton}
            </>
          }
        />
      ) : (
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Regular View</Text>
            <Text style={styles.cardText}>
              The FlatList is unmounted and scrollableRef is null. The auto detent should resize to
              fit this content.
            </Text>
          </View>
          <Spacer />
          <View style={styles.row}>
            {times(3, (i) => (
              <DemoContent key={i} color={DARK_GRAY} style={styles.tile} text={`${i + 1}`} />
            ))}
          </View>
          <Spacer />
          {toggleButton}
        </View>
      )}
      <TrueSheet detents={[0.3]} ref={testRef}>
        <DemoContent />
      </TrueSheet>
    </TrueSheet>
  );
});

FlatListSheet.displayName = 'FlatListSheet';

const styles = StyleSheet.create({
  footer: {
    backgroundColor: Platform.select({
      default: DARK_GRAY,
      ios: DARK_GRAY,
    }),
  },
  content: {
    padding: SPACING,
    paddingTop: HEADER_HEIGHT + SPACING,
    // The safe-area inset is applied natively (contentInsetAdjustmentBehavior)
    paddingBottom: FOOTER_HEIGHT + SPACING,
  },
  card: {
    padding: SPACING,
    gap: GAP / 2,
    borderRadius: BORDER_RADIUS,
    backgroundColor: DARK_GRAY,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: LIGHT_GRAY,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    color: GRAY,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  tile: {
    flex: 1,
    height: 72,
  },
});
