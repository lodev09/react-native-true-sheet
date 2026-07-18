import { StyleSheet, Text, type PressableProps, Pressable } from 'react-native';

import { FOOTER_HEIGHT, SPACING } from '../utils';

interface FooterProps extends PressableProps {
  text?: string;
}

// The footer absorbs the bottom safe-area inset natively — no manual padding
// needed. Set the background via the sheet's `footerStyle` so it fills the inset.
export const Footer = ({ children, text = 'FOOTER', onPress, ...rest }: FooterProps) => {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, onPress && pressed && styles.pressed]}
      onPress={onPress}
      {...rest}
    >
      {children || <Text style={styles.text}>{text}</Text>}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    height: FOOTER_HEIGHT,
    paddingHorizontal: SPACING,
  },
  pressed: {
    opacity: 0.6,
  },
  text: {
    marginTop: SPACING,
    textAlign: 'center',
    color: '#fff',
  },
});
