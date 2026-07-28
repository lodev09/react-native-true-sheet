import { forwardRef, useRef, useState, type Ref, useImperativeHandle } from 'react';
import { StyleSheet, Text } from 'react-native';
import {
  TrueSheet,
  type DetentChangeEvent,
  type TrueSheetProps,
} from '@lodev09/react-native-true-sheet';

import { DARK, GAP, GRAY, SPACING } from '../../utils';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';

interface ResizeSyncSheetProps extends TrueSheetProps {}

// Repro for https://github.com/lodev09/react-native-true-sheet/issues/758 (Bug 2):
// resize() silently no-ops when the internal detent index goes stale after a
// user drag.
export const ResizeSyncSheet = forwardRef((props: ResizeSyncSheetProps, ref: Ref<TrueSheet>) => {
  const sheetRef = useRef<TrueSheet>(null);
  const [lastEvent, setLastEvent] = useState('none');

  useImperativeHandle<TrueSheet | null, TrueSheet | null>(ref, () => sheetRef.current);

  return (
    <TrueSheet
      ref={sheetRef}
      name="resize-sync-sheet"
      detents={[0.25, 0.7]}
      style={styles.content}
      backgroundColor={DARK}
      onDetentChange={(e: DetentChangeEvent) =>
        setLastEvent(`detentChange i:${e.nativeEvent.index}`)
      }
      {...props}
    >
      <Text style={styles.steps}>
        1. Drag to the top detent by the grabber.{'\n'}
        2. Tap Resize(0).{'\n'}
        Bug: the sheet stays put — resize() no-ops on a stale internal index.
      </Text>
      <Text style={styles.status}>last event: {lastEvent}</Text>
      <ButtonGroup>
        <Button text="Resize(0)" onPress={() => sheetRef.current?.resize(0)} />
        <Button text="Resize(1)" onPress={() => sheetRef.current?.resize(1)} />
      </ButtonGroup>
      <Button text="Dismiss" onPress={() => sheetRef.current?.dismiss()} />
    </TrueSheet>
  );
});

const styles = StyleSheet.create({
  content: {
    padding: SPACING,
    gap: GAP,
  },
  steps: {
    color: GRAY,
    lineHeight: 20,
  },
  status: {
    color: 'white',
    fontVariant: ['tabular-nums'],
  },
});

ResizeSyncSheet.displayName = 'ResizeSyncSheet';
