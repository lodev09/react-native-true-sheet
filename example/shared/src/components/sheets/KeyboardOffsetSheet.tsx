import { forwardRef, useRef, useState, type Ref, useImperativeHandle } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet';
import {
  ReanimatedTrueSheet,
  ReanimatedTrueSheetProvider,
  useReanimatedTrueSheet,
} from '@lodev09/react-native-true-sheet/reanimated';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { BLUE, DARK, DARK_GRAY, GAP, GRAY, SPACING } from '../../utils';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import { Input } from '../Input';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface KeyboardOffsetSheetProps extends TrueSheetProps {}

// Repro for https://github.com/lodev09/react-native-true-sheet/issues/758 (Bug 1):
// a footer resize while the keyboard has the sheet grown poisons offset learning,
// so animatedIndex peaks below 1 when dragging to the top detent afterwards.
const IndexIndicator = () => {
  const { animatedIndex } = useReanimatedTrueSheet();

  const textProps = useAnimatedProps(() => ({
    text: `animatedIndex: ${animatedIndex.value.toFixed(3)}`,
    defaultValue: '',
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: `${interpolate(animatedIndex.value, [0, 1], [0, 100], Extrapolation.CLAMP)}%`,
  }));

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedIndex.value, [0, 1], [0.15, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.indicator}>
      <AnimatedTextInput style={styles.indicatorText} editable={false} animatedProps={textProps} />
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
      <Animated.View style={[styles.opacityBox, opacityStyle]}>
        <Text style={styles.opacityBoxText}>Should be fully visible at top detent</Text>
      </Animated.View>
    </View>
  );
};

const KeyboardOffsetSheetInner = forwardRef(
  (props: KeyboardOffsetSheetProps, ref: Ref<TrueSheet>) => {
    const sheetRef = useRef<TrueSheet>(null);
    const [showBar, setShowBar] = useState(false);

    useImperativeHandle<TrueSheet | null, TrueSheet | null>(ref, () => sheetRef.current);

    return (
      <ReanimatedTrueSheet
        ref={sheetRef}
        name="keyboard-offset-sheet"
        detents={[0.25, 0.7]}
        style={styles.content}
        backgroundColor={DARK}
        footerStyle={styles.footer}
        footerOptions={{ position: 'absolute' }}
        footer={
          <>
            {showBar && (
              <View style={styles.bar}>
                <Text style={styles.barText}>Conditional bar — footer height changed</Text>
              </View>
            )}
            <View style={styles.footerRow}>
              <View style={styles.footerInput}>
                <Input placeholder="1. Focus me (keyboard up)" />
              </View>
              <Button
                style={styles.footerButton}
                text={showBar ? 'Hide Bar' : '2. Show Bar'}
                onPress={() => setShowBar(!showBar)}
              />
            </View>
          </>
        }
        {...props}
      >
        <IndexIndicator />
        <Text style={styles.steps}>
          1. Focus the footer input (keyboard up).{'\n'}
          2. Tap "Show Bar" while the keyboard is up.{'\n'}
          3. Dismiss the keyboard, collapse to the bottom detent.{'\n'}
          4. Drag to the top detent by the grabber.{'\n'}
          Bug: animatedIndex peaks well below 1.
        </Text>
        <ButtonGroup>
          <Button text="Collapse" onPress={() => sheetRef.current?.resize(0)} />
          <Button text="Dismiss" onPress={() => sheetRef.current?.dismiss()} />
        </ButtonGroup>
      </ReanimatedTrueSheet>
    );
  }
);

export const KeyboardOffsetSheet = forwardRef(
  (props: KeyboardOffsetSheetProps, ref: Ref<TrueSheet>) => (
    <ReanimatedTrueSheetProvider>
      <KeyboardOffsetSheetInner ref={ref} {...props} />
    </ReanimatedTrueSheetProvider>
  )
);

const styles = StyleSheet.create({
  content: {
    padding: SPACING,
    gap: GAP,
  },
  indicator: {
    gap: GAP / 2,
  },
  indicatorText: {
    color: 'white',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    padding: 0,
  },
  track: {
    backgroundColor: DARK_GRAY,
    borderRadius: 4,
    height: 8,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: BLUE,
    height: 8,
  },
  opacityBox: {
    backgroundColor: BLUE,
    borderRadius: SPACING / 2,
    padding: SPACING / 2,
  },
  opacityBoxText: {
    color: 'white',
    textAlign: 'center',
  },
  steps: {
    color: GRAY,
    lineHeight: 20,
  },
  footer: {
    padding: SPACING,
    gap: GAP,
  },
  footerRow: {
    flexDirection: 'row',
    gap: GAP,
    alignItems: 'center',
  },
  footerInput: {
    flex: 1,
  },
  footerButton: {
    minWidth: 110,
  },
  bar: {
    backgroundColor: DARK_GRAY,
    borderRadius: SPACING / 2,
    padding: SPACING,
  },
  barText: {
    color: GRAY,
    textAlign: 'center',
  },
});

KeyboardOffsetSheetInner.displayName = 'KeyboardOffsetSheetInner';
KeyboardOffsetSheet.displayName = 'KeyboardOffsetSheet';
