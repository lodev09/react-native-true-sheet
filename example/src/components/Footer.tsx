import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { styles as constantStyles, DARK_GRAY, FOOTER_HEIGHT } from '../utils'

export const Footer = () => {
  return (
    <View style={styles.footer}>
      <TouchableOpacity onPress={() => console.log('footer pressed')}>
        <Text style={constantStyles.whiteText}>FOOTER</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  footer: {
    height: FOOTER_HEIGHT,
    // backgroundColor: DARK_GRAY,
    borderWidth: 2,
    borderColor: 'red',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
