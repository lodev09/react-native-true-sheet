import { createStandardNavigator } from 'standard-navigation';

import { TrueSheetNavigatorContent } from './TrueSheetNavigatorContent';
import type {
  TrueSheetNavigationOptions,
  TrueSheetNavigatorContentExtraProps,
  TrueSheetStandardEventMap,
} from './types';

/**
 * Framework-agnostic TrueSheet navigator.
 * Wired into React Navigation via `./index` and Expo Router via `./expo-router`.
 */
export const trueSheetNavigator = createStandardNavigator<
  TrueSheetNavigationOptions,
  TrueSheetStandardEventMap,
  TrueSheetNavigatorContentExtraProps
>(TrueSheetNavigatorContent);
