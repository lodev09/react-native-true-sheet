import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View, type PressableProps, Pressable } from 'react-native';

import { DARK, FOOTER_HEIGHT, SPACING } from '../utils';

type FooterSize = 'small' | 'default';

const FOOTER_SIZES: Record<FooterSize, number> = {
  small: FOOTER_HEIGHT / 1.5,
  default: FOOTER_HEIGHT,
};

interface FooterProps extends Omit<PressableProps, 'children'> {
  text?: string;
  children?: ReactNode;
}

// The footer absorbs the bottom safe-area inset natively — no manual padding
// needed. Set the background via the sheet's `footerStyle` so it fills the inset.
export const Footer = ({ children, text = 'FOOTER', onPress, ...rest }: FooterProps) => {
  const [size, setSize] = useState<FooterSize>('default');

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { height: FOOTER_SIZES[size] },
        onPress && pressed && styles.pressed,
      ]}
      onPress={onPress}
      {...rest}
    >
      {children || <Text style={styles.text}>{text}</Text>}
      <View style={styles.sizeControl}>
        {(['small', 'default'] as const).map((option) => (
          <Pressable
            key={option}
            hitSlop={4}
            style={[styles.sizeOption, size === option && styles.sizeOptionActive]}
            onPress={() => setSize(option)}
          >
            <Text style={[styles.sizeOptionText, size === option && styles.sizeOptionTextActive]}>
              {option === 'small' ? 'Small' : 'Default'}
            </Text>
          </Pressable>
        ))}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingTop: SPACING,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING,
  },
  pressed: {
    opacity: 0.6,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  sizeControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: SPACING,
    padding: 2,
    gap: 2,
  },
  sizeOption: {
    paddingHorizontal: SPACING * 0.75,
    paddingVertical: 2,
    borderRadius: SPACING,
  },
  sizeOptionActive: {
    backgroundColor: '#fff',
  },
  sizeOptionText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '600',
  },
  sizeOptionTextActive: {
    color: DARK,
  },
});
