import { StyleSheet, View, type ViewProps } from 'react-native';

import { SPACING } from '../utils';

type HeaderProps = ViewProps;

export const Header = ({ children, ...rest }: HeaderProps) => {
  return (
    <View style={styles.container} {...rest}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: SPACING * 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: SPACING,
  },
});
