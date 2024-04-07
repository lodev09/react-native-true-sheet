import React from 'react'
import { View, type ColorValue, type ViewProps, type ViewStyle } from 'react-native'

const GRABBER_WRAPPER_HEIGHT = 24
const GRABBER_DEFAULT_HEIGHT = 4
const GRABBER_DEFAULT_WIDTH = 32
const GRABBER_DEFAULT_COLOR = '#49454F'

interface TrueSheetGrabberProps extends ViewProps {
  /**
   * Is grabber visible
   * @default true
   */
  visible?: boolean

  /**
   * Grabber color according to M3 specs
   * @default #49454F
   */
  color?: ColorValue

  /**
   * Grabber height according to M3 specs
   * @default 4
   */
  height?: number

  /**
   * Grabber width according to M3 specs
   * @default 32
   */
  width?: number
}

/**
 * Little Grabber component.
 * Used by defualt for Android but feel free to re-use.
 */
export const TrueSheetGrabber = (props: TrueSheetGrabberProps) => {
  const {
    visible = true,
    color = GRABBER_DEFAULT_COLOR,
    width = GRABBER_DEFAULT_WIDTH,
    height = GRABBER_DEFAULT_HEIGHT,
    style,
    ...rest
  } = props

  if (!visible) return null

  return (
    <View style={$wrapper}>
      <View style={[$grabber, { height, width, backgroundColor: color }, style]} {...rest} />
    </View>
  )
}

const $wrapper: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  alignSelf: 'center',
  height: GRABBER_WRAPPER_HEIGHT,
  alignItems: 'center',
  zIndex: 9999,
}

const $grabber: ViewStyle = {
  // M3 spec for opacity
  opacity: 0.4,
  borderRadius: GRABBER_DEFAULT_HEIGHT / 2,
  top: 6,
}
