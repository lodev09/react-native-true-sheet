import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { DARK_BLUE, SPACING } from '../utils';

interface ButtonProps extends PressableProps {
  text: string;
  loading?: boolean;
}

export const Button = (props: ButtonProps) => {
  const { text, style, loading, ...rest } = props;
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
      {loading && <ActivityIndicator style={styles.loader} size="small" color="#fff" />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 44,
    padding: 12,
    borderRadius: 44,
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
