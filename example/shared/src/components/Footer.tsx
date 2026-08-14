import { createContext, useContext, useState, type ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
  useColorScheme,
  type PressableProps,
  Pressable,
} from 'react-native';

import { DARK, FOOTER_HEIGHT, SPACING } from '../utils';

type FooterSize = 'small' | 'default';

const FOOTER_SIZES: Record<FooterSize, number> = {
  small: FOOTER_HEIGHT / 1.5,
  default: FOOTER_HEIGHT,
};

// Foreground colors for the surface the footer sits on. Defaults to a dark
// surface (white text); a `themed` footer follows the color scheme instead.
const PALETTES = {
  dark: {
    text: '#fff',
    pillBg: 'rgba(255, 255, 255, 0.15)',
    pillText: 'rgba(255, 255, 255, 0.7)',
    activePillBg: '#fff',
    activePillText: DARK,
  },
  light: {
    text: DARK,
    pillBg: 'rgba(0, 0, 0, 0.08)',
    pillText: 'rgba(0, 0, 0, 0.6)',
    activePillBg: DARK,
    activePillText: '#fff',
  },
};

const FooterPaletteContext = createContext(PALETTES.dark);

interface FooterPillProps extends Omit<PressableProps, 'children'> {
  text: string;
  active?: boolean;
}

// Compact pill button sized for the footer row.
export const FooterPill = ({ text, active, ...rest }: FooterPillProps) => {
  const palette = useContext(FooterPaletteContext);
  return (
    <Pressable
      hitSlop={4}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: active ? palette.activePillBg : palette.pillBg },
        pressed && styles.pressed,
      ]}
      {...rest}
    >
      <Text
        style={[styles.pillText, { color: active ? palette.activePillText : palette.pillText }]}
      >
        {text}
      </Text>
    </Pressable>
  );
};

interface FooterProps extends Omit<PressableProps, 'children'> {
  text?: string;
  children?: ReactNode;
  /** Follow the color scheme — for footers on a transparent or adaptive background. */
  themed?: boolean;
}

// The footer absorbs the bottom safe-area inset natively — no manual padding
// needed. Set the background via the sheet's `footerStyle` so it fills the inset.
export const Footer = ({
  children,
  text = 'FOOTER',
  themed = false,
  onPress,
  ...rest
}: FooterProps) => {
  const [size, setSize] = useState<FooterSize>('default');
  const colorScheme = useColorScheme();
  const palette = themed && colorScheme !== 'dark' ? PALETTES.light : PALETTES.dark;

  return (
    <FooterPaletteContext.Provider value={palette}>
      <Pressable
        style={({ pressed }) => [
          styles.container,
          { height: FOOTER_SIZES[size] },
          onPress && pressed && styles.pressed,
        ]}
        onPress={onPress}
        {...rest}
      >
        {children || <Text style={[styles.text, { color: palette.text }]}>{text}</Text>}
        <View style={styles.sizeControl}>
          {(['small', 'default'] as const).map((option) => (
            <FooterPill
              key={option}
              text={option === 'small' ? 'Small' : 'Default'}
              active={size === option}
              onPress={() => setSize(option)}
            />
          ))}
        </View>
      </Pressable>
    </FooterPaletteContext.Provider>
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
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  sizeControl: {
    flexDirection: 'row',
    gap: SPACING / 2,
  },
  pill: {
    paddingHorizontal: SPACING * 0.75,
    paddingVertical: 3,
    borderRadius: SPACING,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
