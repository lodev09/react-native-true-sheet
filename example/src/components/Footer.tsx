import { StyleSheet, Text, TouchableOpacity, View, type ViewProps } from 'react-native';

import { styles as constantStyles, DARK_GRAY, FOOTER_HEIGHT } from '../utils';

type FooterProps = ViewProps;

export const Footer = ({ children, ...rest }: FooterProps) => {
  return (
    <View style={styles.footer} {...rest}>
      {children || (
        <TouchableOpacity onPress={() => console.log('footer pressed')}>
          <Text style={constantStyles.whiteText}>FOOTER</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    height: FOOTER_HEIGHT,
    backgroundColor: DARK_GRAY,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
