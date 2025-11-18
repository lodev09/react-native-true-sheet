import { forwardRef, type ForwardedRef } from 'react'
import Animated from 'react-native-reanimated'

import { TrueSheet } from './TrueSheet'
import type { TrueSheetProps, DetentInfo, PositionChangeEvent } from './TrueSheet.types'
import { useReanimatedTrueSheet } from './ReanimatedTrueSheetProvider'
import { usePositionChangeHandler } from './hooks'

// Create animated version of TrueSheet
const AnimatedTrueSheet = Animated.createAnimatedComponent(TrueSheet)

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
 *           initialIndex={1}
 *         >
 *           <Text>Sheet Content</Text>
 *         </ReanimatedTrueSheet>
 *       </View>
 *     </ReanimatedTrueSheetProvider>
 *   )
 * }
 * ```
 */
export const ReanimatedTrueSheet = forwardRef<TrueSheet, TrueSheetProps>(
  (props, ref: ForwardedRef<TrueSheet>) => {
    const { onPositionChange, ...rest } = props

    const { position } = useReanimatedTrueSheet()

    const positionChangeHandler = usePositionChangeHandler(
      (detentInfo: DetentInfo) => {
        'worklet'
        position.value = detentInfo.value

        // Call user's onPositionChange handler if provided
        onPositionChange?.({
          nativeEvent: detentInfo,
        } as PositionChangeEvent)
      },
      [onPositionChange, position]
    )

    return <AnimatedTrueSheet ref={ref} onPositionChange={positionChangeHandler} {...rest} />
  }
)
