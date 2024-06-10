import React from 'react'
import { Text, TouchableOpacity, type TouchableOpacityProps, type ViewStyle } from 'react-native'

import { $WHITE_TEXT, BORDER_RADIUS, DARK_BLUE } from '../utils'

interface ButtonProps extends TouchableOpacityProps {
  text: string
}

export const Button = (props: ButtonProps) => {
  const { text, style: $styleOverride, ...rest } = props
  return (
    <TouchableOpacity activeOpacity={0.6} style={[$button, $styleOverride]} {...rest}>
      <Text style={$WHITE_TEXT}>{text}</Text>
    </TouchableOpacity>
  )
}

const $button: ViewStyle = {
  height: 40,
  padding: 12,
  borderRadius: BORDER_RADIUS,
  backgroundColor: DARK_BLUE,
  marginBottom: 12,
  alignItems: 'center',
}
