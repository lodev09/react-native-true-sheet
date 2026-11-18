import { useRef } from 'react';
import { ScrollView, type ScrollViewInstance, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrueSheet } from '@lodev09/react-native-true-sheet';

import { Footer, Input } from '@example/shared/components';
import { DARK, DARK_GRAY, FOOTER_HEIGHT, GAP, SPACING, times } from '@example/shared/utils';

import { ReproScreen, useFocusedInitialDetentIndex } from '../../components/ReproScreen';

export default function ReproFooterKeyboardInset() {
  const initialDetentIndex = useFocusedInitialDetentIndex();
  const scrollViewRef = useRef<ScrollViewInstance>(null);
  const insets = useSafeAreaInsets();

  return (
    <ReproScreen
      title="Repro Footer Keyboard Inset"
      description="The scroll view ends above an absolute footer. Focus the last input: it should scroll above the footer that rises with the keyboard, not stay under it."
    >
      <TrueSheet
        detents={[0.7]}
        initialDetentIndex={initialDetentIndex}
        dismissible={false}
        dimmed={false}
        backgroundColor={DARK}
        style={styles.sheet}
        scrollableRef={scrollViewRef}
        footer={<Footer text="FOOTER" />}
        footerStyle={styles.footer}
        footerOptions={{ position: 'absolute' }}
      >
        <View style={[styles.column, { paddingBottom: FOOTER_HEIGHT + insets.bottom }]}>
          <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content}>
            {times(8, (i) => (
              <Input key={i} placeholder={`Input #${i + 1}`} />
            ))}
          </ScrollView>
        </View>
      </TrueSheet>
    </ReproScreen>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
  },
  column: {
    flex: 1,
  },
  content: {
    padding: SPACING,
    gap: GAP,
  },
  footer: {
    backgroundColor: DARK_GRAY,
  },
});
