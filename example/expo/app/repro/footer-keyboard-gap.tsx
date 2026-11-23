import { useEffect, useRef, useState } from 'react';
import {
  type HostInstance,
  Keyboard,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrueSheet } from '@lodev09/react-native-true-sheet';

import { Button, Footer, Input } from '@example/shared/components';
import { DARK, DARK_GRAY, GAP, SPACING, times } from '@example/shared/utils';

import { ReproScreen, useFocusedInitialDetentIndex } from '../../components/ReproScreen';

const SETTLE_DELAY = 700;
const TALL_ROWS = 14;

const bottomOf = (view: HostInstance | null) =>
  new Promise<{ top: number; bottom: number } | null>((resolve) => {
    if (!view) return resolve(null);
    view.measureInWindow((_x, y, _width, height) => resolve({ top: y, bottom: y + height }));
  });

export default function ReproFooterKeyboardGap() {
  const initialDetentIndex = useFocusedInitialDetentIndex();
  const scrollViewRef = useRef<ScrollViewInstance>(null);
  const inputRef = useRef<HostInstance>(null);
  const footerRef = useRef<HostInstance>(null);
  const insets = useSafeAreaInsets();
  const [tall, setTall] = useState(false);
  const [offsetIndex, setOffsetIndex] = useState(0);
  const [closedGap, setClosedGap] = useState<number | null>(null);
  const [openGap, setOpenGap] = useState<number | null>(null);

  const keyboardOffsets = [0, insets.bottom, -16];
  const keyboardOffset = keyboardOffsets[offsetIndex] ?? 0;

  const measure = async (keyboardOpen: boolean) => {
    const [input, footer] = await Promise.all([
      bottomOf(inputRef.current),
      bottomOf(footerRef.current),
    ]);
    if (!input || !footer) return;
    (keyboardOpen ? setOpenGap : setClosedGap)(footer.top - input.bottom);
  };

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => measure(true), SETTLE_DELAY);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setTimeout(() => measure(false), SETTLE_DELAY);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return (
    <ReproScreen
      title="Repro Footer Keyboard Gap"
      description="An auto sheet with a scrollable and an absolute footer. Focus the input: the gap between the input and the footer should stay the same with the keyboard open. keyboardOffset cycles 0, the bottom inset and -16."
    >
      <TrueSheet
        detents={['auto']}
        initialDetentIndex={initialDetentIndex}
        dismissible={false}
        dimmed={false}
        backgroundColor={DARK}
        scrollableRef={scrollViewRef}
        onDidPresent={() => setTimeout(() => measure(false), SETTLE_DELAY)}
        footer={
          <View ref={footerRef}>
            <Footer text="FOOTER" />
          </View>
        }
        footerStyle={styles.footer}
        footerOptions={{ position: 'absolute', keyboardOffset }}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.text}>
            Gap, keyboard closed: {closedGap === null ? '–' : closedGap.toFixed(1)}
          </Text>
          <Text style={styles.text}>
            Gap, keyboard open: {openGap === null ? '–' : openGap.toFixed(1)}
          </Text>
          <Button
            testID="toggle-tall"
            text={tall ? 'Short content' : 'Tall content'}
            onPress={() => setTall((value) => !value)}
          />
          <Button
            testID="cycle-keyboard-offset"
            text={`keyboardOffset: ${keyboardOffset}`}
            onPress={() => setOffsetIndex((index) => (index + 1) % keyboardOffsets.length)}
          />
          {tall && times(TALL_ROWS, (i) => <Input key={i} placeholder={`Filler #${i + 1}`} />)}
          <View ref={inputRef}>
            <Input testID="gap-input" placeholder="Focus me" keyboardType="decimal-pad" />
          </View>
        </ScrollView>
      </TrueSheet>
    </ReproScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING,
    gap: GAP,
  },
  text: {
    color: '#fff',
  },
  footer: {
    backgroundColor: DARK_GRAY,
  },
});
