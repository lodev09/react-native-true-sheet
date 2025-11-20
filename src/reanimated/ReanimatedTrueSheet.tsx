import { forwardRef } from 'react';
import Animated, { type WithSpringConfig, withSpring } from 'react-native-reanimated';

import { TrueSheet } from '../TrueSheet';
import type { TrueSheetProps, PositionChangeEvent } from '../TrueSheet.types';
import { useReanimatedTrueSheet } from './ReanimatedTrueSheetProvider';
import { useReanimatedPositionChangeHandler } from './useReanimatedPositionChangeHandler';

const SPRING_CONFIG: WithSpringConfig = {
  damping: 500,
  stiffness: 1000,
  mass: 3,
  overshootClamping: true,
};

interface ReanimatedTrueSheetProps extends TrueSheetProps {
  /**
   * Worklet version of `onPositionChange`
   *
   * @see {@link TrueSheetProps.onPositionChange}
   */
  onPositionChange?: TrueSheetProps['onPositionChange'];
}

// Create animated version of TrueSheet
const AnimatedTrueSheet = Animated.createAnimatedComponent(TrueSheet);

/**
 * Reanimated-enabled version of TrueSheet that automatically syncs position with the provider's shared value.
 * Must be used within a ReanimatedTrueSheetProvider.
 *
 * NOTE: `onPositionChange` is now under UI thread.
 * Make sure you add `worklet` if you want to override this.
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
export const ReanimatedTrueSheet = forwardRef<TrueSheet, ReanimatedTrueSheetProps>((props, ref) => {
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
    onPositionChange?.({ nativeEvent: payload } as PositionChangeEvent);
  });

  return <AnimatedTrueSheet ref={ref} onPositionChange={positionChangeHandler} {...rest} />;
});
