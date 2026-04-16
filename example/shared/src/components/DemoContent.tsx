import { StyleSheet, Pressable, type ColorValue, type PressableProps, Text } from 'react-native';
import { BORDER_RADIUS, LIGHT_GRAY, SPACING } from '../utils';

interface DemoContentProps extends PressableProps {
  radius?: number;
  color?: ColorValue;
  text?: string;
}

export const DemoContent = (props: DemoContentProps) => {
  const { text, radius = BORDER_RADIUS, style: $style, color = 'rgba(0,0,0,0.3)', ...rest } = props;
  return (
    <Pressable
      style={(state) => [
        styles.content,
        { backgroundColor: color, borderRadius: radius, opacity: state.pressed ? 0.5 : 1 },
        typeof $style === 'function' ? $style(state) : $style,
      ]}
      {...rest}
    >
      {text && <Text style={styles.text}>{text}</Text>}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  content: {
    height: 100,
    padding: SPACING / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
    color: LIGHT_GRAY,
  },
});
