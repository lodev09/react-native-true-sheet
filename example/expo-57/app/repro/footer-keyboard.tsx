import { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';

import { Button, ButtonGroup, Input } from '@example/shared/components';
import { BLUE, DARK, DARK_BLUE, GAP, LIGHT_GRAY, SPACING } from '@example/shared/utils';

import { ReproScreen } from '../../components/ReproScreen';

// Stands in for data the sheet loads after presenting, so the footer mounts late
const LOAD_DELAY = 500;

const MAX_LOGS = 10;

const TIPS = ['No tip', '$10', '$20', 'Other'] as const;
type Tip = (typeof TIPS)[number];

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
      <Text style={styles.probeText}>Submit</Text>
    </Pressable>
  );
};

export default function ReproFooterKeyboard() {
  const sheetRef = useRef<TrueSheet>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [loaded, setLoaded] = useState(false);
  const [tip, setTip] = useState<Tip>('No tip');
  const [logs, setLogs] = useState<string[]>([]);

  const log = (line: string) => setLogs((prev) => [line, ...prev].slice(0, MAX_LOGS));

  return (
    <ReproScreen
      title="Repro Footer Keyboard"
      description="Tap Other: the footer should rise above the keyboard. Press Submit and drag a few pixels before lifting: onPress should fire, and measure() should match the touch (#946). Then tap a preset: the input unmounts and the keyboard hides in the same commit, so the footer should slide down with it, not jump over the content. Try both ways of opening — the first mounts the footer after presenting (#955)."
    >
      <Button
        text="Open Sheet"
        hint="Loads after presenting"
        onPress={() => sheetRef.current?.present()}
      />
      <Button
        text="Open Loaded Sheet"
        hint="Loads before presenting"
        onPress={() => {
          setLoaded(true);
          sheetRef.current?.present();
        }}
      />
      <TrueSheet
        ref={sheetRef}
        detents={['auto']}
        backgroundColor={DARK}
        scrollableRef={scrollViewRef}
        footerStyle={styles.footer}
        footerOptions={{ position: 'absolute' }}
        footer={loaded ? <ProbeButton onLog={log} /> : undefined}
        onDidPresent={() => setTimeout(() => setLoaded(true), LOAD_DELAY)}
        onDidDismiss={() => {
          setLoaded(false);
          setTip('No tip');
        }}
      >
        <ScrollView
          ref={scrollViewRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {loaded ? (
            <>
              <Text style={styles.title}>Tip your crew</Text>
              <ButtonGroup>
                {TIPS.map((option) => (
                  <Button
                    key={option}
                    text={option}
                    style={option === tip && styles.selected}
                    onPress={() => setTip(option)}
                  />
                ))}
              </ButtonGroup>
              {tip === 'Other' && (
                <Input autoFocus placeholder="Tip amount" keyboardType="decimal-pad" />
              )}
            </>
          ) : (
            <Text style={styles.title}>Loading...</Text>
          )}
          {/* Fixed rows — a growing log would resize the auto sheet and move the footer mid-press */}
          <View style={styles.logs}>
            {Array.from({ length: MAX_LOGS }, (_, index) => (
              <Text key={index} style={styles.logText} numberOfLines={1}>
                {logs[index] ?? ' '}
              </Text>
            ))}
          </View>
          <Button text="Clear Log" onPress={() => setLogs([])} />
        </ScrollView>
      </TrueSheet>
    </ReproScreen>
  );
}

const styles = StyleSheet.create({
  // The footer's height is padded in natively (contentInsetAdjustment)
  content: {
    padding: SPACING,
    gap: GAP,
  },
  footer: {
    backgroundColor: DARK_BLUE,
    padding: SPACING,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  selected: {
    backgroundColor: BLUE,
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
    lineHeight: 14,
  },
});
