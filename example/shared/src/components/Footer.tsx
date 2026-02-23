import { Platform, StyleSheet, Text, View, type PressableProps, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DARK_GRAY, FOOTER_HEIGHT, SPACING } from '../utils';

const isIPad = Platform.OS === 'ios' && Platform.isPad;

interface FooterProps extends PressableProps {
  text?: string;
}

export const Footer = ({ children, text = 'FOOTER', onPress, ...rest }: FooterProps) => {
  const insets = useSafeAreaInsets();
  const bottomInset = isIPad ? 0 : insets.bottom;

  return (
    <View style={[styles.wrapper, { paddingBottom: bottomInset }]}>
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
    padding: SPACING,
  },
  pressed: {
    opacity: 0.6,
  },
  text: {
    textAlign: 'center',
    color: '#fff',
  },
});
