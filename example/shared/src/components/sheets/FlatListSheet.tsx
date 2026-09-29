import { forwardRef, useRef, useState } from 'react';
import { StyleSheet, FlatList, View, Text } from 'react-native';
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
import { Input } from '../Input';

interface FlatListSheetProps extends TrueSheetProps {}

export const FlatListSheet = forwardRef<TrueSheet, FlatListSheetProps>((props, ref) => {
  const testRef = useRef<TrueSheet>(null);
  const scrollRef = useRef<FlatList>(null);
  const [itemCount, setItemCount] = useState(1);
  const [showList, setShowList] = useState(true);

  const toggleButton = (
    <Button
      style={styles.secondaryButton}
      text={showList ? 'Switch to View' : 'Switch to List'}
      onPress={() => setShowList((show) => !show)}
    />
  );

  return (
    <TrueSheet
      ref={ref}
      detents={['auto']}
      dismissThreshold="short"
      backgroundColor={DARK}
      scrollableRef={scrollRef}
      scrollableOptions={{
        bottomScrollEdgeEffect: 'soft',
        topScrollEdgeEffect: 'soft',
      }}
      header={
        <Header>
          <View style={styles.heading}>
            <Text style={styles.title}>FlatList</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </View>
        </Header>
      }
      headerOptions={{ position: 'absolute' }}
      onDidDismiss={() => console.log('Sheet FlatList dismissed!')}
      onDidPresent={() => console.log(`Sheet FlatList presented!`)}
      footer={<Footer text="OPEN BLANK SHEET" onPress={() => testRef.current?.present()} />}
      footerStyle={styles.footer}
      footerOptions={{ position: 'absolute' }}
      {...props}
    >
      <View style={styles.search}>
        <Input placeholder="Search..." accessibilityLabel="Search items" />
      </View>
      {showList ? (
        <FlatList
          ref={scrollRef}
          data={times(itemCount, (i) => i)}
          contentContainerStyle={styles.content}
          indicatorStyle="white"
          alwaysBounceVertical={false}
          ItemSeparatorComponent={Spacer}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <View style={styles.itemNumber}>
                <Text style={styles.itemNumberText}>{String(item + 1).padStart(2, '0')}</Text>
              </View>
              <Text style={styles.itemTitle}>Item {item + 1}</Text>
            </View>
          )}
          ListFooterComponent={
            <View style={styles.controls}>
              <ButtonGroup>
                <Button text="Add Item" onPress={() => setItemCount((count) => count + 1)} />
                <Button
                  style={styles.secondaryButton}
                  text="Remove Item"
                  onPress={() => setItemCount((count) => Math.max(0, count - 1))}
                />
              </ButtonGroup>
              {toggleButton}
            </View>
          }
        />
      ) : (
        <View style={[styles.content, styles.viewContent]}>
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
    backgroundColor: DARK,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GAP,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: LIGHT_GRAY,
  },
  countBadge: {
    paddingHorizontal: GAP,
    paddingVertical: GAP / 2,
    borderRadius: BORDER_RADIUS,
    backgroundColor: DARK_GRAY,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: GRAY,
  },
  // The footer and safe-area insets are applied natively (contentInsetAdjustment)
  content: {
    padding: SPACING,
  },
  viewContent: {
    paddingBottom: FOOTER_HEIGHT + SPACING,
  },
  search: {
    paddingHorizontal: SPACING,
    paddingTop: HEADER_HEIGHT + SPACING,
    paddingBottom: GAP / 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING,
    padding: SPACING,
    borderRadius: BORDER_RADIUS,
    backgroundColor: DARK_GRAY,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  itemNumber: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: GAP,
    backgroundColor: DARK,
  },
  itemNumberText: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    color: GRAY,
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: LIGHT_GRAY,
  },
  controls: {
    marginTop: SPACING * 1.5,
    gap: GAP,
  },
  secondaryButton: {
    backgroundColor: DARK_GRAY,
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
