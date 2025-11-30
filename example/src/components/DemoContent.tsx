import { StyleSheet, View, type ColorValue, type ViewProps, Text } from 'react-native';
import { BORDER_RADIUS, LIGHT_GRAY, SPACING } from '../utils';

interface DemoContentProps extends ViewProps {
  radius?: number;
  color?: ColorValue;
  text?: string;
}

export const DemoContent = (props: DemoContentProps) => {
  const { text, radius = BORDER_RADIUS, style: $style, color = 'rgba(0,0,0,0.3)', ...rest } = props;
  return (
    <View
      style={[styles.content, { backgroundColor: color, borderRadius: radius }, $style]}
      {...rest}
    >
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    height: 100,
    padding: SPACING / 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
    color: LIGHT_GRAY,
  },
});
