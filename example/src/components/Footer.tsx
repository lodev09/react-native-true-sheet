import { StyleSheet, Text, type PressableProps, Pressable } from 'react-native';

import { DARK_GRAY, FOOTER_HEIGHT } from '../utils';

interface FooterProps extends PressableProps {
  text?: string;
}

export const Footer = ({ children, text = 'FOOTER', ...rest }: FooterProps) => {
  return (
    <Pressable style={styles.container} {...rest}>
      {children || <Text style={styles.text}>{text}</Text>}
    </Pressable>
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
