import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { TrueSheet } from '../../TrueSheet';
import {
  TrueSheetNavigatorContent,
  type TrueSheetNavigatorContentProps,
} from '../TrueSheetNavigatorContent';
import type { TrueSheetNavigationOptions } from '../types';

let isReanimatedLoaded = false;

jest.mock('react-native-reanimated', () => {
  isReanimatedLoaded = true;
  const createAnimatedComponent = (component: unknown) => component;
  return {
    __esModule: true,
    default: { createAnimatedComponent },
    createAnimatedComponent,
    useHandler: () => ({ context: {}, doDependenciesDiffer: false }),
    useEvent: (handler: unknown) => handler,
    Easing: { bezier: () => (t: number) => t },
  };
});

jest.mock('react-native-worklets', () => ({ scheduleOnRN: jest.fn() }));

const renderNavigator = (options: TrueSheetNavigationOptions) => {
  const props = {
    routes: [
      { key: 'home', name: 'Home' },
      { key: 'details', name: 'Details' },
    ],
    descriptors: {
      home: { options: {}, render: () => <Text>Home</Text> },
      details: { options, render: () => <Text>Details</Text> },
    },
    dispatch: jest.fn(),
    emitter: { emit: jest.fn() },
  } as unknown as TrueSheetNavigatorContentProps;

  return render(<TrueSheetNavigatorContent {...props} />);
};

describe('TrueSheetNavigatorContent', () => {
  // The registry is module state that can't be unregistered, so one test walks
  // through before and after the reanimated entry is imported.
  it('uses the plain screen until the reanimated entry is imported, then the reanimated screen', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const positionChangeHandler = jest.fn();

    const before = renderNavigator({ reanimated: true, positionChangeHandler });

    expect(before.getByText('Details')).toBeTruthy();
    expect(isReanimatedLoaded).toBe(false);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Import '@lodev09/react-native-true-sheet/navigation/reanimated'")
    );

    const payload = { index: 0, position: 400, detent: 0.5, realtime: true };
    before.UNSAFE_getByType(TrueSheet).props.onPositionChange({ nativeEvent: payload });
    expect(positionChangeHandler).toHaveBeenCalledWith(payload);
    before.unmount();
    warn.mockClear();

    require('../reanimated');
    const { ReanimatedTrueSheetScreen } = require('../screen/ReanimatedTrueSheetScreen');

    const after = renderNavigator({ reanimated: true, positionChangeHandler });

    expect(after.getByText('Details')).toBeTruthy();
    expect(isReanimatedLoaded).toBe(true);
    expect(after.UNSAFE_getByType(ReanimatedTrueSheetScreen)).toBeTruthy();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
