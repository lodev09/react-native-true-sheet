import { StyleSheet, Text, TouchableOpacity, type TouchableOpacityProps } from 'react-native'

import { styles as constantStyles, BORDER_RADIUS, DARK_BLUE } from '../utils'

interface ButtonProps extends TouchableOpacityProps {
  text: string
}

export const Button = (props: ButtonProps) => {
  const { text, style: $styleOverride, ...rest } = props
  return (
    <TouchableOpacity activeOpacity={0.6} style={[styles.button, $styleOverride]} {...rest}>
      <Text style={constantStyles.whiteText}>{text}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    height: 40,
    padding: 12,
    borderRadius: BORDER_RADIUS,
    backgroundColor: DARK_BLUE,
    marginBottom: 12,
    alignItems: 'center',
  },
})
