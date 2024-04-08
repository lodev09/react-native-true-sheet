import React from 'react'
import { View, type ColorValue, type ViewStyle, type StyleProp } from 'react-native'

const GRABBER_DEFAULT_HEIGHT = 4
const GRABBER_DEFAULT_WIDTH = 32

// M3 spec: #49454F 0.4 alpha
const GRABBER_DEFAULT_COLOR = 'rgba(73,69,79,0.4)'

export interface TrueSheetGrabberProps {
  /**
   * Is grabber visible.
   * @default true
   */
  visible?: boolean

  /**
   * Optional style that overrides the default style.
   */
  style?: StyleProp<ViewStyle>

  /**
   * Grabber color according to M3 specs.
   * @default rgba(73,69,79,0.4)
   */
  color?: ColorValue

  /**
   * Grabber height according to M3 specs.
   * @default 4
   */
  height?: number

  /**
   * Grabber top position offset.
   *
   * @default 6
   */
  topOffset?: number

  /**
   * Grabber width according to M3 specs.
   * @default 32
   */
  width?: number
}

/**
 * Grabber component.
 * Used by defualt for Android but feel free to re-use.
 */
export const TrueSheetGrabber = (props: TrueSheetGrabberProps) => {
  const {
    visible = true,
    color = GRABBER_DEFAULT_COLOR,
    width = GRABBER_DEFAULT_WIDTH,
    height = GRABBER_DEFAULT_HEIGHT,
    topOffset = 0,
    style,
  } = props

  if (!visible) return null

  return (
    <View style={[$wrapper, style, { height: GRABBER_DEFAULT_HEIGHT * 4, top: topOffset }]}>
      <View style={[$grabber, { height, width, backgroundColor: color }]} />
    </View>
  )
}

const $wrapper: ViewStyle = {
  position: 'absolute',
  alignSelf: 'center',
  paddingHorizontal: 12,
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
}

const $grabber: ViewStyle = {
  borderRadius: GRABBER_DEFAULT_HEIGHT / 2,
}
