import { StyleSheet, Platform, type ViewProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { HEADER_HEIGHT, SPACING } from '../utils';
import { Input } from './Input';

type HeaderProps = ViewProps;

export const Header = ({ children, style, ...rest }: HeaderProps) => {
  return (
    <Animated.View style={[styles.container, style]} {...rest}>
      {children || <Input />}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: Platform.select({ ios: HEADER_HEIGHT, default: HEADER_HEIGHT + SPACING }),
    paddingTop: Platform.select({ android: SPACING * 2 }),
    justifyContent: 'center',
    padding: SPACING,
  },
});
