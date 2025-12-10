import { forwardRef, useEffect } from 'react';
import { useWindowDimensions } from 'react-native';

import { TrueSheet } from '../TrueSheet.web';
import type { TrueSheetProps, TrueSheetRef, PositionChangeEvent } from '../TrueSheet.types';
import { useReanimatedTrueSheet } from './ReanimatedTrueSheetProvider';

interface ReanimatedTrueSheetProps extends TrueSheetProps {
  /**
   * Callback for position changes.
   * On web, this is called with the position data from @gorhom/bottom-sheet.
   *
   * @see {@link TrueSheetProps.onPositionChange}
   */
  onPositionChange?: TrueSheetProps['onPositionChange'];
}

/**
 * Reanimated-enabled version of TrueSheet for web that automatically syncs
 * position with the provider's shared value.
 * Must be used within a ReanimatedTrueSheetProvider.
 *
 * @example
 * ```tsx
 * import { ReanimatedTrueSheet, ReanimatedTrueSheetProvider } from '@lodev09/react-native-true-sheet/reanimated'
 *
 * function MyScreen() {
 *   const sheetRef = useRef<TrueSheetRef>(null)
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
export const ReanimatedTrueSheet = forwardRef<TrueSheetRef, ReanimatedTrueSheetProps>(
  (props, ref) => {
    const { onPositionChange, detents = [0.5, 1], ...rest } = props;
    const { height: windowHeight } = useWindowDimensions();

    const { animatedPosition, animatedIndex, animatedDetent } = useReanimatedTrueSheet();

    // Reset animated values when component unmounts
    useEffect(() => {
      return () => {
        animatedPosition.value = windowHeight;
        animatedIndex.value = -1;
        animatedDetent.value = 0;
      };
    }, [windowHeight]);

    const handlePositionChange = (event: PositionChangeEvent) => {
      const { position, index, detent } = event.nativeEvent;

      // Sync with provider's shared values
      animatedPosition.value = position;
      animatedIndex.value = index;
      animatedDetent.value = detent;

      // Call user's callback
      onPositionChange?.(event);
    };

    return (
      <TrueSheet ref={ref} detents={detents} onPositionChange={handlePositionChange} {...rest} />
    );
  }
);
