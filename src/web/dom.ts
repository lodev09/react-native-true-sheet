/// <reference lib="dom" />
import type { View } from 'react-native';

/**
 * Resolves a React Native web `View` ref value to its underlying DOM element —
 * RN-web refs expose the host DOM node directly.
 */
export const getDOMElement = (view: View | null): HTMLElement | null =>
  view instanceof HTMLElement ? view : null;
