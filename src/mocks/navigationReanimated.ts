import { createElement } from 'react';

import { registerReanimatedScreen } from '../navigation/screen/reanimatedScreen';
import type { TrueSheetScreenProps } from '../navigation/screen/types';
import { TrueSheet } from './index';

const ReanimatedTrueSheetScreen = ({
  routeKey,
  detentIndex,
  detents,
  children,
  dispatch: _dispatch,
  emit: _emit,
  closing: _closing,
  resizeKey: _resizeKey,
  positionChangeHandler: _positionChangeHandler,
  ...sheetProps
}: TrueSheetScreenProps) =>
  createElement(
    TrueSheet,
    {
      name: `navigation-sheet-${routeKey}`,
      initialDetentIndex: detentIndex,
      detents,
      ...sheetProps,
    },
    children
  );

/**
 * Mock of the navigator's reanimated integration for testing, with the real navigator: registers
 * a screen rendering the mocked `TrueSheet`, so screens with `reanimated: true` render without
 * loading react-native-reanimated or the native sheet, and without warning that the integration
 * isn't enabled.
 * Import from '@lodev09/react-native-true-sheet/navigation/reanimated/mock' in your test setup.
 */
registerReanimatedScreen(ReanimatedTrueSheetScreen);
