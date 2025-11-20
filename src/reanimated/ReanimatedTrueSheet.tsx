import { forwardRef } from 'react';
import Animated, { type WithSpringConfig, withSpring } from 'react-native-reanimated';

import { TrueSheet } from '../TrueSheet';
import type { TrueSheetProps, PositionChangeEvent } from '../TrueSheet.types';
import { useReanimatedTrueSheet } from './ReanimatedTrueSheetProvider';
import { useReanimatedPositionChangeHandler } from './useReanimatedPositionChangeHandler';
import { scheduleOnRN } from 'react-native-worklets';

const SPRING_CONFIG: WithSpringConfig = {
  damping: 500,
  stiffness: 1000,
  mass: 3,
  overshootClamping: true,
};

// Create animated version of TrueSheet
const AnimatedTrueSheet = Animated.createAnimatedComponent(TrueSheet);

/**
 * Reanimated-enabled version of TrueSheet that automatically syncs position with the provider's shared value.
 * Must be used within a ReanimatedTrueSheetProvider.
 *
 * @example
 * ```tsx
 * import { ReanimatedTrueSheet, ReanimatedTrueSheetProvider } from '@lodev09/react-native-true-sheet'
 *
 * function MyScreen() {
 *   const sheetRef = useRef<TrueSheet>(null)
 *
 *   return (
 *     <ReanimatedTrueSheetProvider>
 *       <View>
 *         <ReanimatedTrueSheet
 *           ref={sheetRef}
 *           detents={[0.25, 0.5, 1]}
 *           initialDetentIndex={1}
 *         >
 *           <Text>Sheet Content</Text>
 *         </ReanimatedTrueSheet>
 *       </View>
 *     </ReanimatedTrueSheetProvider>
 *   )
 * }
 * ```
 */
export const ReanimatedTrueSheet = forwardRef<TrueSheet, TrueSheetProps>((props, ref) => {
  const { onPositionChange, ...rest } = props;

  const { animatedPosition, animatedIndex } = useReanimatedTrueSheet();

  const positionChangeHandler = useReanimatedPositionChangeHandler((payload) => {
    'worklet';

    // This is used on IOS to tell us that we have to manually animate the value
    // because since IOS 26, transitioning no longer sends real-time position during
    // transition.
    if (payload.transitioning) {
      animatedPosition.value = withSpring(payload.position, SPRING_CONFIG);
    } else {
      animatedPosition.value = payload.position;
    }

    animatedIndex.value = payload.index;

    if (onPositionChange) {
      scheduleOnRN(onPositionChange, {
        nativeEvent: payload,
      } as PositionChangeEvent);
    }
  });

  return <AnimatedTrueSheet ref={ref} onPositionChange={positionChangeHandler} {...rest} />;
});
