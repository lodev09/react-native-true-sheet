import { TextInput, View, type TextStyle, type ViewStyle } from 'react-native'

import { BORDER_RADIUS, GRAY, INPUT_HEIGHT, SPACING } from '../utils'

export const Input = () => {
  return (
    <View style={$inputContainer}>
      <TextInput style={$input} placeholder="Enter some text..." placeholderTextColor={GRAY} />
    </View>
  )
}

const $inputContainer: ViewStyle = {
  backgroundColor: 'white',
  paddingHorizontal: SPACING,
  height: INPUT_HEIGHT,
  borderRadius: BORDER_RADIUS,
  justifyContent: 'center',
  marginBottom: SPACING,
}

const $input: TextStyle = {
  fontSize: 16,
  height: INPUT_HEIGHT,
}
