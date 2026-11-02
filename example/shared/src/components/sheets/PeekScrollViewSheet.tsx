import { forwardRef, useRef } from 'react';
import { StyleSheet, ScrollView, Text } from 'react-native';
import { TrueSheet, TrueSheetPeek, type TrueSheetProps } from '@lodev09/react-native-true-sheet';

import { DARK, DARK_BLUE, DARK_GRAY, GAP, LIGHT_GRAY, SPACING, times } from '../../utils';
import { DemoContent } from '../DemoContent';
import { Footer } from '../Footer';
import { Header } from '../Header';

interface PeekScrollViewSheetProps extends TrueSheetProps {}

// Repro: a peek nested in a ScrollView. Expand, scroll to the end, then drag
// down from the header. The sheet should settle at the peek, not a sliver.
export const PeekScrollViewSheet = forwardRef<TrueSheet, PeekScrollViewSheetProps>((props, ref) => {
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <TrueSheet
      ref={ref}
      detents={['peek', 1]}
      backgroundColor={DARK}
      scrollableRef={scrollViewRef}
      header={<Header />}
      footer={<Footer />}
      footerStyle={styles.footer}
      {...props}
    >
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content}>
        <DemoContent color={DARK_BLUE} />
        <TrueSheetPeek style={styles.peek}>
          <Text style={styles.title}>Peek ScrollView</Text>
          <Text style={styles.subtitle}>The peek ends below this block.</Text>
        </TrueSheetPeek>
        {times(10, (i) => (
          <DemoContent key={i} text={`Item #${i + 1}`} />
        ))}
      </ScrollView>
    </TrueSheet>
  );
});

PeekScrollViewSheet.displayName = 'PeekScrollViewSheet';

const styles = StyleSheet.create({
  content: {
    padding: SPACING,
    gap: GAP,
  },
  peek: {
    gap: GAP / 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: LIGHT_GRAY,
  },
  footer: {
    backgroundColor: DARK_GRAY,
  },
});
