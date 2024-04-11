import React from 'react'
import {
  View,
  type ColorValue,
  type ViewProps,
  type TextStyle,
  type ViewStyle,
  Text,
} from 'react-native'
import { BORDER_RADIUS, LIGHT_GRAY, SPACING } from '../utils'

interface DemoContentProps extends ViewProps {
  radius?: number
  color?: ColorValue
  text?: string
}

export const DemoContent = (props: DemoContentProps) => {
  const { text, radius = BORDER_RADIUS, style: $style, color = LIGHT_GRAY, ...rest } = props
  return (
    <View
      style={[$demoContent, { backgroundColor: color, borderRadius: radius }, $style]}
      {...rest}
    >
      {text && <Text style={$demoText}>{text}</Text>}
    </View>
  )
}

const $demoContent: ViewStyle = {
  height: 100,
  marginBottom: 16,
  padding: SPACING / 2,
  alignItems: 'center',
}

const $demoText: TextStyle = {
  fontSize: 16,
  lineHeight: 20,
  color: 'white',
}
