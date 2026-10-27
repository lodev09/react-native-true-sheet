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
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it("doesn't load reanimated for a reanimated screen until the reanimated entry is imported", () => {
    const positionChangeHandler = jest.fn();
    const { getByText, UNSAFE_getByType } = renderNavigator({
      reanimated: true,
      positionChangeHandler,
    });

    expect(getByText('Details')).toBeTruthy();
    expect(isReanimatedLoaded).toBe(false);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Import '@lodev09/react-native-true-sheet/navigation/reanimated'")
    );

    const payload = { index: 0, position: 400, detent: 0.5, realtime: true };
    UNSAFE_getByType(TrueSheet).props.onPositionChange({ nativeEvent: payload });
    expect(positionChangeHandler).toHaveBeenCalledWith(payload);
  });

  it('loads nothing native with the mock of the reanimated entry', () => {
    jest.isolateModules(() => {
      jest.doMock('../../TrueSheet', () => {
        throw new Error('native TrueSheet loaded');
      });
      expect(() => require('../../mocks/navigationReanimated')).not.toThrow();
      jest.dontMock('../../TrueSheet');
    });
  });

  it('renders the mocked sheet, without warning, with the mock of the reanimated entry', () => {
    require('../../mocks/navigationReanimated');
    const { TrueSheet: TrueSheetMock } = require('../../mocks');

    const { getByText, UNSAFE_getByType } = renderNavigator({ reanimated: true });

    expect(getByText('Details')).toBeTruthy();
    expect(UNSAFE_getByType(TrueSheetMock).props.name).toBe('navigation-sheet-details');
    expect(isReanimatedLoaded).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });

  it('renders the reanimated screen once the reanimated entry is imported', () => {
    require('../reanimated');
    const { ReanimatedTrueSheetScreen } = require('../screen/ReanimatedTrueSheetScreen');

    const { getByText, UNSAFE_getByType } = renderNavigator({ reanimated: true });

    expect(getByText('Details')).toBeTruthy();
    expect(isReanimatedLoaded).toBe(true);
    expect(UNSAFE_getByType(ReanimatedTrueSheetScreen)).toBeTruthy();
    expect(warn).not.toHaveBeenCalled();
  });
});
