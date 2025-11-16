import { Text, TouchableOpacity, View, type ViewStyle } from 'react-native'

import { $WHITE_TEXT, DARK_GRAY, FOOTER_HEIGHT } from '../utils'

export const Footer = () => {
  return (
    <View style={$footer}>
      <TouchableOpacity onPress={() => console.log('footer pressed')}>
        <Text style={$WHITE_TEXT}>FOOTER</Text>
      </TouchableOpacity>
    </View>
  )
}

const $footer: ViewStyle = {
  height: FOOTER_HEIGHT,
  backgroundColor: DARK_GRAY,
  alignItems: 'center',
  justifyContent: 'center',
}
