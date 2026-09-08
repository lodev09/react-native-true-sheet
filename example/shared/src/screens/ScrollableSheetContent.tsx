import type { RefObject } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { TrueSheetProps } from '@lodev09/react-native-true-sheet';

import { Button } from '../components/Button';
import { DemoContent } from '../components/DemoContent';
import { Input } from '../components/Input';
import { FOOTER_HEIGHT, GAP, HEADER_HEIGHT, LIGHT_GRAY, SPACING, times } from '../utils';

interface ScrollableSheetContentProps {
  // Typed as the sheet's own prop type — the app that owns the ref hands it to
  // both the ScrollView and the sheet.
  scrollableRef: TrueSheetProps['scrollableRef'];
  onResize: () => void;
  onPop: () => void;
}

export const ScrollableSheetContent = ({
  scrollableRef,
  onResize,
  onPop,
}: ScrollableSheetContentProps) => {
  return (
    <ScrollView
      ref={scrollableRef as RefObject<ScrollView | null>}
      contentContainerStyle={styles.content}
      keyboardDismissMode="on-drag"
    >
      <Text style={styles.sheetTitle}>Scrollable Sheet</Text>
      <Text style={styles.sheetSubtitle}>
        ScrollView plugged in via the `scrollableRef` screen option.
      </Text>
      <View style={styles.buttons}>
        <Button text="Resize to 100%" onPress={onResize} />
        <Button text="pop()" onPress={onPop} />
      </View>
      {times(8, (i) => (
        <DemoContent key={i} text={`Item #${i + 1}`} />
      ))}
      {/* Offscreen until scrolled to — focusing it scrolls the sheet automatically */}
      <Input />
      <Input multiline />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: SPACING,
    // Clear the absolute header and footer
    paddingTop: HEADER_HEIGHT + SPACING,
    paddingBottom: FOOTER_HEIGHT + SPACING,
    gap: GAP,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  sheetSubtitle: {
    fontSize: 14,
    color: LIGHT_GRAY,
    marginBottom: SPACING,
  },
  buttons: {
    gap: GAP,
  },
});
