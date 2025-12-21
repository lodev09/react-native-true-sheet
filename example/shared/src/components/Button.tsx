import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { BUTTON_HEIGHT, DARK_BLUE, SPACING } from '../utils';

interface ButtonProps extends PressableProps {
  text: string;
  loading?: boolean;
}

export const Button = (props: ButtonProps) => {
  const { text, style, loading, ...rest } = props;
  return (
    <Pressable
      style={(state) => [
        styles.button,
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      <Text style={styles.text}>{text}</Text>
      {loading && <ActivityIndicator style={styles.loader} size="small" color="#fff" />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: BUTTON_HEIGHT,
    padding: 12,
    borderRadius: BUTTON_HEIGHT,
    backgroundColor: DARK_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    color: '#fff',
  },
  loader: {
    position: 'absolute',
    right: SPACING,
  },
});
