import { forwardRef, useRef, type Ref, useImperativeHandle } from 'react'
import { StyleSheet, Text, useWindowDimensions, type ViewStyle } from 'react-native'
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet'
import Animated, { useAnimatedStyle, useSharedValue, withDecay } from 'react-native-reanimated'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'

import { DARK, DARK_GRAY, GRABBER_COLOR, SPACING, times } from '../../utils'
import { Footer } from '../Footer'
import { Spacer } from '../Spacer'
import { Button } from '../Button'
import { DemoContent } from '../DemoContent'

const BOXES_COUNT = 20
const CONTAINER_HEIGHT = 200
const BOX_GAP = SPACING
const BOX_SIZE = CONTAINER_HEIGHT - SPACING * 2

interface GestureSheetProps extends TrueSheetProps {}

export const GestureSheet = forwardRef((props: GestureSheetProps, ref: Ref<TrueSheet>) => {
  const sheetRef = useRef<TrueSheet>(null)

  const scrollX = useSharedValue(0)
  const dimensions = useWindowDimensions()

  const dismiss = async () => {
    await sheetRef.current?.dismiss()
  }

  const $animatedContainer: ViewStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scrollX.value }],
  }))

  const pan = Gesture.Pan()
    .onChange((e) => {
      scrollX.value += e.changeX
    })
    .onFinalize((e) => {
      scrollX.value = withDecay({
        velocity: e.velocityX,
        rubberBandEffect: true,
        clamp: [-((BOX_SIZE + BOX_GAP) * BOXES_COUNT) + dimensions.width - SPACING, 0],
      })
    })
    .activeOffsetX([-10, 10])

  useImperativeHandle<TrueSheet | null, TrueSheet | null>(ref, () => sheetRef.current)

  return (
    <TrueSheet
      sizes={['auto']}
      ref={sheetRef}
      contentContainerStyle={styles.content}
      blurTint="dark"
      edgeToEdge
      backgroundColor={DARK}
      cornerRadius={12}
      grabberProps={{ color: GRABBER_COLOR }}
      onDismiss={() => console.log('Gesture sheet dismissed!')}
      onPresent={({ index, value }) =>
        console.log(`Gesture sheet presented with size of ${value} at index: ${index}`)
      }
      onSizeChange={({ index, value }) => console.log(`Resized to:`, value, 'at index:', index)}
      FooterComponent={<Footer />}
      {...props}
    >
      <Text style={styles.text}>
        react-native-gesture-handler is causing build issues on Android at this time 🤷‍♂️
      </Text>
      <Spacer />
      <Text style={styles.text}>Removed for now.</Text>
      <Spacer />
      <Button text="Dismis" onPress={dismiss} />
      <GestureHandlerRootView>
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.panContainer, $animatedContainer]}>
            {times(BOXES_COUNT, (i) => (
              <DemoContent key={i} text={String(i + 1)} style={styles.box} />
            ))}
          </Animated.View>
        </GestureDetector>
        <Button text="Dismis" onPress={dismiss} />
      </GestureHandlerRootView>
    </TrueSheet>
  )
})

GestureSheet.displayName = 'GestureSheet'

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    backgroundColor: DARK_GRAY,
    height: BOX_SIZE,
    justifyContent: 'center',
    width: BOX_SIZE,
  },
  content: {
    padding: SPACING,
  },
  panContainer: {
    flexDirection: 'row',
    gap: BOX_GAP,
    height: CONTAINER_HEIGHT,
    marginBottom: SPACING,
    paddingVertical: SPACING,
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
    color: 'white',
  },
})
