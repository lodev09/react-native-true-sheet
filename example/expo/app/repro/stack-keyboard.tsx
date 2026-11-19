import { useRef } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';

import { Button } from '@example/shared/components';
import { DARK, DARK_GRAY, GAP, GRAY, SPACING } from '@example/shared/utils';

import { ReproScreen } from '../../components/ReproScreen';

export default function ReproStackKeyboard() {
  const sheetA = useRef<TrueSheet>(null);
  const sheetB = useRef<TrueSheet>(null);
  const sheetC = useRef<TrueSheet>(null);

  return (
    <ReproScreen
      title="Repro stack keyboard"
      description="Android: present A, then B, then C, which focuses its input. Dismiss C with the keyboard up. A should stay behind B."
    >
      <Button testID="present-a" text="Present A" onPress={() => sheetA.current?.present()} />
      <TrueSheet
        ref={sheetA}
        detents={[0.65]}
        dimmed={false}
        dismissible={false}
        backgroundColor={DARK}
        style={styles.content}
      >
        <Text style={styles.label}>Sheet A</Text>
        <Button testID="present-b" text="Present B" onPress={() => sheetB.current?.present()} />
      </TrueSheet>
      <TrueSheet
        ref={sheetB}
        detents={['auto']}
        dimmed={false}
        dismissible={false}
        backgroundColor={DARK_GRAY}
        style={styles.content}
      >
        <Text style={styles.label}>Sheet B</Text>
        <Button testID="present-c" text="Present C" onPress={() => sheetC.current?.present()} />
      </TrueSheet>
      <TrueSheet ref={sheetC} detents={[1]} backgroundColor={DARK} style={styles.content}>
        <Text style={styles.label}>Sheet C</Text>
        <TextInput
          testID="input-c"
          autoFocus
          placeholder="Type here"
          placeholderTextColor={GRAY}
          style={styles.input}
        />
        <Button testID="dismiss-c" text="Dismiss C" onPress={() => sheetC.current?.dismiss()} />
      </TrueSheet>
    </ReproScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING,
    paddingTop: SPACING * 2,
    gap: GAP,
  },
  label: {
    color: 'white',
    fontSize: 20,
    fontWeight: '500',
  },
  input: {
    height: SPACING * 3,
    paddingHorizontal: SPACING,
    borderRadius: SPACING,
    backgroundColor: DARK_GRAY,
    color: 'white',
  },
});
