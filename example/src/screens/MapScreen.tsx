import { useRef } from 'react'
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { TrueSheet, type DetentInfo } from '@lodev09/react-native-true-sheet'
import MapView from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated'

import { Button, Footer, Spacer } from '../components'
import { BLUE, DARK, DARK_BLUE, GRAY, SPACING, SPRING_CONFIG } from '../utils'
import { useDragChangeHandler } from '../hooks'
import {
  BasicSheet,
  BlankSheet,
  FlatListSheet,
  GestureSheet,
  PromptSheet,
  ScrollViewSheet,
} from '../components/sheets'

const AnimatedButton = Animated.createAnimatedComponent(TouchableOpacity)
const AnimatedTrueSheet = Animated.createAnimatedComponent(TrueSheet)

export const MapScreen = () => {
  const sheetRef = useRef<TrueSheet>(null)

  const basicSheet = useRef<TrueSheet>(null)
  const promptSheet = useRef<TrueSheet>(null)
  const scrollViewSheet = useRef<TrueSheet>(null)
  const flatListSheet = useRef<TrueSheet>(null)
  const gestureSheet = useRef<TrueSheet>(null)
  const blankSheet = useRef<TrueSheet>(null)

  const insets = useSafeAreaInsets()
  const buttonY = useSharedValue(0)

  const dragChangeHandler = useDragChangeHandler((detentInfo: DetentInfo) => {
    'worklet'
    buttonY.value = -detentInfo.value
  })

  const presentBasicSheet = async (index = 0) => {
    await basicSheet.current?.present(index)
    console.log('Sheet 1 present async')
  }

  const $floatingButtonStyles: StyleProp<ViewStyle> = [
    styles.floatingButton,
    { bottom: insets.bottom + SPACING },
    useAnimatedStyle(() => ({
      transform: [{ translateY: buttonY.value }],
    })),
  ]

  const animateButton = (detentInfo: DetentInfo) => {
    buttonY.value = withSpring(-detentInfo.value, SPRING_CONFIG)
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialCamera={{
          altitude: 18000,
          zoom: 14,
          center: {
            latitude: 9.306743705457553,
            longitude: 123.30474002203727,
          },
          pitch: 0,
          heading: 0,
        }}
        userInterfaceStyle="dark"
      />
      <AnimatedButton
        activeOpacity={0.6}
        style={$floatingButtonStyles}
        onPress={() => sheetRef.current?.resize(0)}
      />
      <AnimatedTrueSheet
        detents={[0.15, 'auto', 1]}
        ref={sheetRef}
        blurTint="dark"
        backgroundColor={DARK}
        edgeToEdge
        style={{ padding: SPACING, paddingBottom: SPACING * 3 }}
        dimmedIndex={2}
        dismissible={false}
        cornerRadius={12}
        initialIndex={1}
        onDragChange={dragChangeHandler}
        onDidPresent={(e) => animateButton(e.nativeEvent)}
        onDetentChange={(e) => animateButton(e.nativeEvent)}
        onDragEnd={(e) => animateButton(e.nativeEvent)}
        // initialIndexAnimated={false}
        onMount={() => {
          // sheetRef.current?.present(1)
          console.log('Sheet is ready!')
        }}
        footer={<Footer />}
      >
        <View style={styles.heading}>
          <Text style={styles.title}>True Sheet 💩</Text>
          <Text style={styles.subtitle}>The true native bottom sheet experience.</Text>
        </View>
        <Button text="TrueSheet View" onPress={() => presentBasicSheet(0)} />
        <Button text="TrueSheet Prompt" onPress={() => promptSheet.current?.present()} />
        <Button text="TrueSheet ScrollView" onPress={() => scrollViewSheet.current?.present()} />
        <Button text="TrueSheet FlatList" onPress={() => flatListSheet.current?.present()} />
        <Button text="TrueSheet Gestures" onPress={() => gestureSheet.current?.present()} />
        <Button text="Blank Sheet" onPress={() => blankSheet.current?.present()} />

        <Spacer />
        <Button text="Expand" onPress={() => sheetRef.current?.resize(2)} />
        <Button text="Collapse" onPress={() => sheetRef.current?.resize(1)} />

        <BasicSheet ref={basicSheet} />
        <PromptSheet ref={promptSheet} />
        <ScrollViewSheet ref={scrollViewSheet} />
        <FlatListSheet ref={flatListSheet} />
        <GestureSheet ref={gestureSheet} />
        <BlankSheet ref={blankSheet} />
      </AnimatedTrueSheet>
    </View>
  )
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    right: SPACING,
    height: SPACING * 3,
    width: SPACING * 3,
    borderRadius: (SPACING * 3) / 2,
    backgroundColor: DARK_BLUE,
    shadowColor: DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  container: {
    backgroundColor: BLUE,
    justifyContent: 'center',
    flex: 1,
  },
  map: {
    flex: 1,
  },
  heading: {
    marginBottom: SPACING * 2,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 500,
    color: 'white',
  },
  subtitle: {
    lineHeight: 24,
    color: GRAY,
  },
})
