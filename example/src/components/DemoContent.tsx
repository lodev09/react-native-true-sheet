import {
  View,
  type ColorValue,
  type ViewProps,
  Text,
  type ViewStyle,
  type TextStyle,
} from 'react-native'
import { BORDER_RADIUS, SPACING } from '../utils'

interface DemoContentProps extends ViewProps {
  radius?: number
  color?: ColorValue
  text?: string
}

export const DemoContent = (props: DemoContentProps) => {
  const { text, radius = BORDER_RADIUS, style: $style, color = 'rgba(0,0,0,0.2)', ...rest } = props
  return (
    <View style={[$content, { backgroundColor: color, borderRadius: radius }, $style]} {...rest}>
      {text && <Text style={$text}>{text}</Text>}
    </View>
  )
}

const $content: ViewStyle = {
  height: 100,
  marginBottom: 16,
  padding: SPACING / 2,
  alignItems: 'center',
}

const $text: TextStyle = {
  fontSize: 16,
  lineHeight: 20,
  color: 'white',
}
