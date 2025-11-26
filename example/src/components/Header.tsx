import { StyleSheet, Platform, View, type ViewProps } from 'react-native';

import { HEADER_HEIGHT, SPACING } from '../utils';
import { Input } from './Input';

type HeaderProps = ViewProps;

export const Header = ({ children, ...rest }: HeaderProps) => {
  return (
    <View
      style={styles.container}
      onLayout={(e) => console.log(e.nativeEvent.layout.height)}
      {...rest}
    >
      {children || <Input />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: Platform.select({ ios: HEADER_HEIGHT, android: HEADER_HEIGHT + SPACING }),
    paddingTop: Platform.select({ android: SPACING * 2 }),
    justifyContent: 'center',
    padding: SPACING,
  },
});
