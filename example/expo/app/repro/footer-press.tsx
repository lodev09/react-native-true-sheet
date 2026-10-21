import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';

import { Button, Input } from '@example/shared/components';
import { BLUE, DARK, DARK_BLUE, GAP, LIGHT_GRAY, SPACING } from '@example/shared/utils';

import { ReproScreen } from '../../components/ReproScreen';

const MAX_LOGS = 10;

interface ProbeButtonProps {
  onLog: (line: string) => void;
}

// Logs what Pressability compares: the page origin measure() reports on press
// in, and the page coordinates that arrive with the touch.
const ProbeButton = ({ onLog }: ProbeButtonProps) => {
  const ref = useRef<View>(null);
  const moved = useRef(false);

  return (
    <Pressable
      ref={ref}
      style={({ pressed }) => [styles.probe, pressed && styles.probePressed]}
      onTouchStart={(e) => {
        moved.current = false;
        onLog(`touchStart  pageY ${e.nativeEvent.pageY.toFixed(1)}`);
      }}
      onTouchMove={(e) => {
        if (moved.current) return;
        moved.current = true;
        onLog(`touchMove   pageY ${e.nativeEvent.pageY.toFixed(1)}`);
      }}
      onPressIn={() => {
        onLog('pressIn');
        ref.current?.measure((_x, _y, _w, h, _px, py) =>
          onLog(`measure     pageY ${py.toFixed(1)} height ${h.toFixed(1)}`)
        );
      }}
      onPressOut={() => onLog('pressOut')}
      onPress={() => onLog('onPress ✅')}
    >
      <Text style={styles.probeText}>FOOTER</Text>
    </Pressable>
  );
};

export default function ReproFooterPress() {
  const sheetRef = useRef<TrueSheet>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const log = (line: string) => setLogs((prev) => [line, ...prev].slice(0, MAX_LOGS));

  return (
    <ReproScreen
      title="Repro Footer Press"
      description="Focus the input so the absolute footer rises above the keyboard, then press FOOTER and drag a few pixels before lifting. onPress should fire, and measure() should match the touch (#946)."
    >
      <Button text="Open Sheet" onPress={() => sheetRef.current?.present()} />
      <TrueSheet
        ref={sheetRef}
        detents={[0.7]}
        backgroundColor={DARK}
        style={styles.sheet}
        footerStyle={styles.footer}
        footerOptions={{ position: 'absolute' }}
        footer={<ProbeButton onLog={log} />}
      >
        <Input placeholder="Focus me to open the keyboard" />
        <View style={styles.logs}>
          {logs.length === 0 && <Text style={styles.logText}>No events yet.</Text>}
          {logs.map((line, index) => (
            <Text key={`${line}-${index}`} style={styles.logText} numberOfLines={1}>
              {line}
            </Text>
          ))}
        </View>
        <Button text="Clear Log" onPress={() => setLogs([])} />
      </TrueSheet>
    </ReproScreen>
  );
}

const styles = StyleSheet.create({
  sheet: {
    padding: SPACING,
    gap: GAP,
  },
  footer: {
    backgroundColor: DARK_BLUE,
    padding: SPACING,
  },
  probe: {
    height: SPACING * 3,
    borderRadius: SPACING,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  probePressed: {
    opacity: 0.6,
  },
  probeText: {
    color: 'white',
    fontWeight: '600',
  },
  logs: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: SPACING / 2,
    padding: SPACING / 2,
    gap: 2,
  },
  logText: {
    color: LIGHT_GRAY,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    fontSize: 11,
  },
});
