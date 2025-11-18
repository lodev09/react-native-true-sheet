import { forwardRef } from 'react'
import Animated, { type WithSpringConfig, withSpring } from 'react-native-reanimated'

import { TrueSheet } from './TrueSheet'
import type {
  TrueSheetProps,
  DetentInfo,
  PositionChangeEvent,
  WillPresentEvent,
  WillDismissEvent,
} from './TrueSheet.types'
import { useReanimatedTrueSheet } from './ReanimatedTrueSheetProvider'
import { usePositionChangeHandler, useWillPresentHandler, useWillDismissHandler } from './hooks'
import { Platform, useWindowDimensions } from 'react-native'
import { scheduleOnRN } from 'react-native-worklets'

const SPRING_CONFIG: WithSpringConfig = {
  damping: 500,
  stiffness: 1000,
  mass: 3,
  overshootClamping: true,
}

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
export const ReanimatedTrueSheet = forwardRef<TrueSheet, TrueSheetProps>((props, ref) => {
  const { onPositionChange, onWillPresent, onWillDismiss, ...rest } = props

  const { height } = useWindowDimensions()
  const { position } = useReanimatedTrueSheet()

  const positionChangeHandler = usePositionChangeHandler((detentInfo: DetentInfo) => {
    'worklet'
    position.value = detentInfo.position

    if (onPositionChange) {
      scheduleOnRN(onPositionChange, {
        nativeEvent: detentInfo,
      } as PositionChangeEvent)
    }
  })

  const willPresentHandler = useWillPresentHandler((detentInfo: DetentInfo) => {
    'worklet'
    // On IOS, animate to target position since this is not supported during transition.
    if (Platform.OS === 'ios') {
      position.value = withSpring(detentInfo.position, SPRING_CONFIG)
    }

    if (onWillPresent) {
      scheduleOnRN(onWillPresent, {
        nativeEvent: detentInfo,
      } as WillPresentEvent)
    }
  })

  const willDismissHandler = useWillDismissHandler(() => {
    'worklet'
    // On iOS, animate to 0 since this is not supported during transition.
    if (Platform.OS === 'ios') {
      position.value = withSpring(height, SPRING_CONFIG)
    }

    if (onWillDismiss) {
      scheduleOnRN(onWillDismiss, {} as WillDismissEvent)
    }
  })

  return (
    <AnimatedTrueSheet
      ref={ref}
      onPositionChange={positionChangeHandler}
      onWillPresent={willPresentHandler}
      onWillDismiss={willDismissHandler}
      {...rest}
    />
  )
})
