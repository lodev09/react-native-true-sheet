import { forwardRef, useRef, type Ref, useImperativeHandle } from 'react';
import { StyleSheet, useWindowDimensions, type ViewStyle } from 'react-native';
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet';
import Animated, { useAnimatedStyle, useSharedValue, withDecay } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

import { DARK, DARK_GRAY, FOOTER_HEIGHT, GAP, SPACING, times } from '../../utils';
import { Footer } from '../Footer';
import { Button } from '../Button';
import { DemoContent } from '../DemoContent';

const BOXES_COUNT = 20;
const CONTAINER_HEIGHT = 200;
const BOX_SIZE = CONTAINER_HEIGHT - SPACING * 2;

interface GestureSheetProps extends TrueSheetProps {}

export const GestureSheet = forwardRef((props: GestureSheetProps, ref: Ref<TrueSheet>) => {
  const sheetRef = useRef<TrueSheet>(null);

  const scrollX = useSharedValue(0);
  const dimensions = useWindowDimensions();

  const dismiss = async () => {
    await sheetRef.current?.dismiss();
  };

  const animatedContainerStyle: ViewStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scrollX.value }],
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
      detents={['auto']}
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
      footer={<Footer />}
      {...props}
    >
      <GestureHandlerRootView style={styles.gestureRoot}>
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.panContainer, animatedContainerStyle]}>
            {times(BOXES_COUNT, (i) => (
              <DemoContent key={i} text={String(i + 1)} style={styles.box} />
            ))}
          </Animated.View>
        </GestureDetector>
        <Button text="Dismiss" onPress={dismiss} />
      </GestureHandlerRootView>
    </TrueSheet>
  );
});

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
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
});

GestureSheet.displayName = 'GestureSheet';
