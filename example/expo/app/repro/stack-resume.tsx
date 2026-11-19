import { useRef } from 'react';
import { StyleSheet, Text } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';

import { Button } from '@example/shared/components';
import { DARK, DARK_GRAY, GAP, SPACING } from '@example/shared/utils';

import { ReproScreen } from '../../components/ReproScreen';

export default function ReproStackResume() {
  const sheetA = useRef<TrueSheet>(null);
  const sheetB = useRef<TrueSheet>(null);
  const sheetC = useRef<TrueSheet>(null);

  return (
    <ReproScreen
      title="Repro stack resume"
      description="Android: present A, then B, then C. Send the app to the background and reopen it. A and B should stay behind C."
    >
      <Button testID="present-a" text="Present A" onPress={() => sheetA.current?.present()} />
      <TrueSheet
        ref={sheetA}
        detents={[0.8]}
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
        detents={[0.5]}
        dimmed={false}
        dismissible={false}
        backgroundColor={DARK_GRAY}
        style={styles.content}
      >
        <Text style={styles.label}>Sheet B</Text>
        <Button testID="present-c" text="Present C" onPress={() => sheetC.current?.present()} />
      </TrueSheet>
      <TrueSheet
        ref={sheetC}
        detents={['auto']}
        dimmed={false}
        dismissible={false}
        backgroundColor={DARK}
        style={styles.content}
      >
        <Text style={styles.label}>Sheet C</Text>
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
});
