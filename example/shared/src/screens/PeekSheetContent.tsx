import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TrueSheetPeek } from '@lodev09/react-native-true-sheet';

import { Button } from '../components/Button';
import { DemoContent } from '../components/DemoContent';
import { DARK, DARK_BLUE, GAP, LIGHT_GRAY, SPACING } from '../utils/constants';

type PeekScreenName = 'First' | 'Second';

// Mirrors a navigator transition: both screens stay mounted for the duration.
const SWAP_DURATION = 300;

interface PeekScreenProps {
  name: PeekScreenName;
  onSwap: () => void;
  onPop: () => void;
}

const PeekScreen = ({ name, onSwap, onPop }: PeekScreenProps) => {
  return (
    <View style={styles.screen}>
      <TrueSheetPeek style={styles.peek}>
        <Text style={styles.sheetTitle}>Peek {name}</Text>
        <Text style={styles.sheetSubtitle}>
          Peek covers this block. Swap screens and the sheet should resize to the new peek.
        </Text>
        {/* Second screen has a taller peek so the swap is visible */}
        {name === 'Second' && <DemoContent color={DARK_BLUE} />}
        <View style={styles.buttons}>
          <Button text="Swap Screen" onPress={onSwap} />
          <Button text="pop()" onPress={onPop} />
        </View>
      </TrueSheetPeek>
      <DemoContent color={DARK_BLUE} />
    </View>
  );
};

interface PeekSheetContentProps {
  onPop: () => void;
}

// Repro (#851): two screens inside one sheet, each rendering a TrueSheetPeek.
// The incoming screen mounts before the outgoing one unmounts — on Android the
// new peek was refused, then the old one detached, so the peek detent fell back
// to the fixed 150 height.
export const PeekSheetContent = ({ onPop }: PeekSheetContentProps) => {
  const [screens, setScreens] = useState<PeekScreenName[]>(['First']);

  const swap = () => {
    const next: PeekScreenName = screens[screens.length - 1] === 'First' ? 'Second' : 'First';
    setScreens((prev) => [...prev, next]);
    setTimeout(() => setScreens([next]), SWAP_DURATION);
  };

  return (
    <View style={styles.sheetContent}>
      {screens.map((name) => (
        <PeekScreen key={name} name={name} onSwap={swap} onPop={onPop} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  sheetContent: {
    flex: 1,
  },
  // Top-pinned without a bottom edge so a sheet resize doesn't relayout the
  // screen — a relayout would re-attach the peek and hide the collapse.
  screen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: DARK,
    padding: SPACING,
    gap: GAP,
  },
  peek: {
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
  },
  buttons: {
    gap: GAP,
  },
});
