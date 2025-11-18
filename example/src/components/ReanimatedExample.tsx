import { useRef } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import {
  ReanimatedTrueSheet,
  useReanimatedTrueSheet,
  type TrueSheet,
} from '@lodev09/react-native-true-sheet'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button, DemoContent } from '.'
import { BLUE, DARK_BLUE, GAP, SPACING } from '../utils'

const AnimatedButton = Animated.createAnimatedComponent(TouchableOpacity)

export const ReanimatedExample = () => {
  const sheetRef = useRef<TrueSheet>(null)
  const insets = useSafeAreaInsets()
  const { position } = useReanimatedTrueSheet()

  const floatingButtonStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -position.value }],
  }))

  const headerStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - position.value / 300),
  }))

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, headerStyle]}>
        <Text style={styles.headerText}>Header fades as sheet rises</Text>
      </Animated.View>

      <AnimatedButton
        activeOpacity={0.7}
        style={[styles.floatingButton, { bottom: insets.bottom + SPACING }, floatingButtonStyle]}
        onPress={() => sheetRef.current?.resize(2)}
      >
        <Text style={styles.buttonText}>↑</Text>
      </AnimatedButton>

      <ReanimatedTrueSheet
        ref={sheetRef}
        detents={[0.3, 0.6, 1]}
        initialIndex={1}
        backgroundColor={DARK_BLUE}
        cornerRadius={16}
        dimmedIndex={2}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.title}>Reanimated TrueSheet 🎨</Text>
          <Text style={styles.subtitle}>
            The floating button and header are animated with Reanimated!
          </Text>

          <DemoContent color={BLUE} />

          <Button text="Collapse" onPress={() => sheetRef.current?.resize(0)} />
          <Button text="Half Expand" onPress={() => sheetRef.current?.resize(1)} />
          <Button text="Full Expand" onPress={() => sheetRef.current?.resize(2)} />
          <Button text="Dismiss" onPress={() => sheetRef.current?.dismiss()} />
        </View>
      </ReanimatedTrueSheet>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 100,
    paddingHorizontal: SPACING * 2,
    paddingVertical: SPACING,
    backgroundColor: BLUE,
    borderRadius: 12,
  },
  headerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    right: SPACING,
    width: SPACING * 3,
    height: SPACING * 3,
    borderRadius: (SPACING * 3) / 2,
    backgroundColor: BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
  },
  sheetContent: {
    padding: SPACING,
    gap: GAP,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: SPACING,
  },
})
