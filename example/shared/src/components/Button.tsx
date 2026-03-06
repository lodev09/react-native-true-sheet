import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { BUTTON_HEIGHT, DARK_BLUE, SPACING } from '../utils';

interface ButtonProps extends PressableProps {
  text: string;
  hint?: string;
  loading?: boolean;
}

export const Button = (props: ButtonProps) => {
  const { text, hint, style, loading, ...rest } = props;
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
      {hint && <Text style={styles.hint}>{hint}</Text>}
      {loading && <ActivityIndicator style={styles.loader} size="small" color="#fff" />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: BUTTON_HEIGHT,
    padding: SPACING,
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
  hint: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  loader: {
    position: 'absolute',
    right: SPACING,
  },
});
