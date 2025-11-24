import { StyleSheet, Text, TouchableOpacity, View, type ViewProps } from 'react-native';

import { DARK_GRAY, FOOTER_HEIGHT } from '../utils';

type FooterProps = ViewProps;

export const Footer = ({ children, ...rest }: FooterProps) => {
  return (
    <View style={styles.container} {...rest}>
      {children || (
        <TouchableOpacity onPress={() => console.log('footer pressed')}>
          <Text style={styles.text}>FOOTER</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: FOOTER_HEIGHT,
    backgroundColor: DARK_GRAY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
  },
});
