import {
  StyleSheet,
  Text,
  View,
  type PressableProps,
  Pressable,
  type ViewStyle,
  type StyleProp,
} from 'react-native';

import { DARK_GRAY, FOOTER_HEIGHT, SPACING } from '../utils';

interface FooterProps extends PressableProps {
  wrapperStyle?: StyleProp<ViewStyle>;
  text?: string;
}

// The footer absorbs the bottom safe-area inset natively — no manual padding needed
export const Footer = ({
  children,
  text = 'FOOTER',
  onPress,
  wrapperStyle,
  ...rest
}: FooterProps) => {
  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      <Pressable
        style={({ pressed }) => [styles.container, onPress && pressed && styles.pressed]}
        onPress={onPress}
        {...rest}
      >
        {children || <Text style={styles.text}>{text}</Text>}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: DARK_GRAY,
  },
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
