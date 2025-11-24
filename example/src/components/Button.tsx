import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { BORDER_RADIUS, DARK_BLUE } from '../utils';

interface ButtonProps extends PressableProps {
  text: string;
}

export const Button = (props: ButtonProps) => {
  const { text, style, ...rest } = props;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...rest}
    >
      <Text style={styles.text}>{text}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 40,
    padding: 12,
    borderRadius: BORDER_RADIUS,
    backgroundColor: DARK_BLUE,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    color: '#fff',
  },
});
