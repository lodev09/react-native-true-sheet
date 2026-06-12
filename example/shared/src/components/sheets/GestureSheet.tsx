import { forwardRef, useRef, type Ref, useImperativeHandle } from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet';
import Animated, { useAnimatedStyle, useSharedValue, withDecay } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BLUE, DARK, DARK_GRAY, FOOTER_HEIGHT, GAP, LIGHT_GRAY, SPACING, times } from '../../utils';
import { Button } from '../Button';
import { DemoContent } from '../DemoContent';
import { SwipeButton } from '../SwipeButton';

const BOXES_COUNT = 20;
const CONTAINER_HEIGHT = 200;
const BOX_SIZE = CONTAINER_HEIGHT - SPACING * 2;
const TRACK_HEIGHT = 180;
const THUMB_HEIGHT = 56;

interface GestureSheetProps extends TrueSheetProps {}

export const GestureSheet = forwardRef((props: GestureSheetProps, ref: Ref<TrueSheet>) => {
  const sheetRef = useRef<TrueSheet>(null);

  const scrollX = useSharedValue(0);
  const dimensions = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isIPad = (Platform.OS === 'ios' && Platform.isPad) || Platform.OS === 'web';
  const bottomInset = isIPad ? 0 : insets.bottom;

  const dismiss = async () => {
    await sheetRef.current?.dismiss();
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scrollX.value }],
  }));

  // Vertical pan on a non-scrollable view competes with sheet drag.
  // The thumb should win once RNGH activates and disallows parent interception.
  const thumbY = useSharedValue(0);

  const verticalPan = Gesture.Pan()
    .onChange((e) => {
      thumbY.value = Math.min(Math.max(thumbY.value + e.changeY, 0), TRACK_HEIGHT - THUMB_HEIGHT);
    })
    .activeOffsetY([-10, 10]);

  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: thumbY.value }],
  }));

  const pan = Gesture.Pan()
    .onChange((e) => {
      scrollX.value += e.changeX;
    })
    .onFinalize((e) => {
      scrollX.value = withDecay({
        velocity: e.velocityX,
        rubberBandEffect: true,
        clamp: [-((BOX_SIZE + GAP) * BOXES_COUNT) + dimensions.width - SPACING, 0],
      });
    })
    .activeOffsetX([-10, 10]);

  useImperativeHandle<TrueSheet | null, TrueSheet | null>(ref, () => sheetRef.current);

  return (
    <TrueSheet
      detents={['auto', 0.5]}
      name="gesture"
      ref={sheetRef}
      style={styles.content}
      backgroundBlur="dark"
      backgroundColor={DARK}
      onDidDismiss={() => console.log('Gesture sheet dismissed!')}
      onDidPresent={(e) =>
        console.log(
          `Gesture sheet presented at index: ${e.nativeEvent.index}, position: ${e.nativeEvent.position}`
        )
      }
      onDetentChange={(e) =>
        console.log(
          `Detent changed to index:`,
          e.nativeEvent.index,
          'position:',
          e.nativeEvent.position
        )
      }
      footer={
        <GestureHandlerRootView style={[styles.footerRoot, { paddingBottom: bottomInset }]}>
          <SwipeButton onComplete={() => console.log('swipe completed!')}>
            Swipe to confirm
          </SwipeButton>
        </GestureHandlerRootView>
      }
      {...props}
    >
      <GestureHandlerRootView style={styles.gestureRoot}>
        <SwipeButton onComplete={() => console.log('swipe completed!')}>
          Swipe to confirm
        </SwipeButton>
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.panContainer, animatedContainerStyle]}>
            {times(BOXES_COUNT, (i) => (
              <DemoContent key={i} text={String(i + 1)} style={styles.box} />
            ))}
          </Animated.View>
        </GestureDetector>
        <Animated.View style={styles.track}>
          <GestureDetector gesture={verticalPan}>
            <Animated.View style={[styles.thumb, animatedThumbStyle]}>
              <Text style={styles.thumbText}>Drag me ↕</Text>
            </Animated.View>
          </GestureDetector>
        </Animated.View>
        <Button text="Dismiss" onPress={dismiss} />
      </GestureHandlerRootView>
    </TrueSheet>
  );
});

const styles = StyleSheet.create({
  gestureRoot: {
    flexGrow: 1,
  },
  footerRoot: {
    flexGrow: 1,
    paddingHorizontal: SPACING,
    paddingTop: SPACING / 2,
  },
  box: {
    alignItems: 'center',
    backgroundColor: DARK_GRAY,
    height: BOX_SIZE,
    justifyContent: 'center',
    width: BOX_SIZE,
  },
  content: {
    padding: SPACING,
    paddingTop: SPACING * 2,
    paddingBottom: FOOTER_HEIGHT + SPACING,
  },
  panContainer: {
    flexDirection: 'row',
    gap: GAP,
    height: CONTAINER_HEIGHT,
    paddingVertical: SPACING,
  },
  track: {
    backgroundColor: DARK_GRAY,
    borderRadius: SPACING,
    height: TRACK_HEIGHT,
    marginBottom: SPACING,
    padding: SPACING / 4,
    width: '100%',
  },
  thumb: {
    alignItems: 'center',
    backgroundColor: BLUE,
    borderRadius: SPACING - SPACING / 4,
    height: THUMB_HEIGHT,
    justifyContent: 'center',
  },
  thumbText: {
    color: LIGHT_GRAY,
    fontSize: 16,
  },
});

GestureSheet.displayName = 'GestureSheet';
