import type { CSSProperties } from 'react';

import type { BackgroundBlur } from '../TrueSheet.types';

// Same as Android
const MAX_DIM_BLUR_RADIUS = 50; // px, at dimOpacity 1

// The iOS material tints at full intensity as [gray, alpha], same as Android's TrueSheetBlurStyle
const TINTS = {
  'light': [252, 78],
  'extra-light': [246, 204],
  'dark': [27, 187],
  'system-ultra-thin-material-light': [229, 98],
  'system-thin-material-light': [238, 151],
  'system-material-light': [243, 207],
  'system-thick-material-light': [243, 243],
  'system-chrome-material-light': [244, 186],
  'system-ultra-thin-material-dark': [72, 110],
  'system-thin-material-dark': [49, 161],
  'system-material-dark': [39, 203],
  'system-thick-material-dark': [32, 249],
  'system-chrome-material-dark': [26, 187],
} satisfies Partial<Record<BackgroundBlur, [number, number]>>;

type FixedBlur = keyof typeof TINTS;

// Like the iOS trait collection, styles without a `-light` or `-dark` suffix follow the color scheme
const resolveBlur = (blur: BackgroundBlur, isDark: boolean): FixedBlur => {
  if (blur in TINTS) return blur as FixedBlur;
  if (blur === 'default') return 'light';
  if (blur === 'regular') return isDark ? 'dark' : 'light';
  if (blur === 'prominent') return isDark ? 'dark' : 'extra-light';
  return `${blur}-${isDark ? 'dark' : 'light'}` as FixedBlur;
};

export const getDimBlurStyle = (
  blur: BackgroundBlur,
  intensity: number,
  isDark: boolean
): CSSProperties => {
  const [gray, alpha] = TINTS[resolveBlur(blur, isDark)];
  const filter = `blur(${intensity * MAX_DIM_BLUR_RADIUS}px)`;
  return {
    backgroundColor: `rgba(${gray}, ${gray}, ${gray}, ${(alpha / 255) * intensity})`,
    backdropFilter: filter,
    WebkitBackdropFilter: filter,
  };
};
