import { Platform } from 'react-native';

export const SPACING = 16;
export const GAP = 12;
export const INPUT_HEIGHT = SPACING * 3;
export const BUTTON_HEIGHT = SPACING * 3;
export const HEADER_HEIGHT = SPACING * 5;
export const FOOTER_HEIGHT = SPACING * 4;
export const BORDER_RADIUS = SPACING;

export const DARK = '#282e37';
export const GRAY = '#b2bac8';
export const DARK_GRAY = '#333b48';
export const LIGHT_GRAY = '#ebedf1';
export const BLUE = '#3784d7';
export const DARK_BLUE = '#1f64ae';

// Scroll edge effects need iOS 26+. Elsewhere, absolute bars keep a background
// so content scrolling under them doesn't show through.
export const HAS_SCROLL_EDGE_EFFECTS =
  Platform.OS === 'ios' && parseInt(String(Platform.Version), 10) >= 26;
