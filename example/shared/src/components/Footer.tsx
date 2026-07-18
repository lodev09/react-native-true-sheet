import {
  Platform,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  Pressable,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DARK_GRAY, FOOTER_HEIGHT, SPACING } from '../utils';

const isIPad = (Platform.OS === 'ios' && Platform.isPad) || Platform.OS === 'web';

interface FooterProps extends PressableProps {
  wrapperStyle?: StyleProp<ViewStyle>;
  text?: string;
  // A relative footer absorbs the bottom inset natively — only an absolute
  // footer needs manual padding
  absolute?: boolean;
}

export const Footer = ({
  children,
  text = 'FOOTER',
  onPress,
  wrapperStyle,
  absolute = false,
  ...rest
}: FooterProps) => {
  const insets = useSafeAreaInsets();
  const bottomInset = absolute && !isIPad ? insets.bottom : 0;

  return (
    <View style={[styles.wrapper, { paddingBottom: bottomInset }, wrapperStyle]}>
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
