import { StyleSheet, Text as RNText, useColorScheme, type TextProps } from 'react-native';

import { DARK, LIGHT_GRAY } from '../utils';

// Theme-aware Text — defaults its color to the system color scheme.
// Pass `style` to override.
export const Text = ({ style, ...rest }: TextProps) => {
  const isDark = useColorScheme() === 'dark';
  return <RNText style={[isDark ? styles.dark : styles.light, style]} {...rest} />;
};

const styles = StyleSheet.create({
  light: {
    color: DARK,
  },
  dark: {
    color: LIGHT_GRAY,
  },
});
