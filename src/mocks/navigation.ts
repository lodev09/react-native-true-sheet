import type { ParamListBase } from '@react-navigation/native';

import type { TrueSheetNavigationProp } from '../navigation/types';

/**
 * Mock createTrueSheetNavigator for testing.
 * Import from '@lodev09/react-native-true-sheet/navigation/mock' in your test setup.
 */
export const createTrueSheetNavigator = jest.fn(() => ({
  Navigator: jest.fn(({ children }: { children: React.ReactNode }) => children),
  Screen: jest.fn(() => null),
  Group: jest.fn(() => null),
}));

/**
 * Mock TrueSheetActions for testing.
 */
export const TrueSheetActions = {
  push: jest.fn((name: string, params?: object) => ({ type: 'PUSH', payload: { name, params } })),
  pop: jest.fn((count?: number) => ({ type: 'POP', payload: { count } })),
  popTo: jest.fn((name: string, params?: object) => ({
    type: 'POP_TO',
    payload: { name, params },
  })),
  popToTop: jest.fn(() => ({ type: 'POP_TO_TOP' })),
  replace: jest.fn((name: string, params?: object) => ({
    type: 'REPLACE',
    payload: { name, params },
  })),
  resize: jest.fn((index: number) => ({ type: 'RESIZE', index })),
  dismiss: jest.fn(() => ({ type: 'DISMISS' })),
  remove: jest.fn(() => ({ type: 'REMOVE' })),
};

/**
 * Mock useTrueSheetNavigation hook for testing.
 */
export const useTrueSheetNavigation = jest.fn(
  <T extends ParamListBase = ParamListBase>() =>
    ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      reset: jest.fn(),
      setParams: jest.fn(),
      dispatch: jest.fn(),
      isFocused: jest.fn(() => true),
      canGoBack: jest.fn(() => true),
      getId: jest.fn(),
      getParent: jest.fn(),
      getState: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
      removeListener: jest.fn(),
      setOptions: jest.fn(),
      push: jest.fn(),
      pop: jest.fn(),
      popTo: jest.fn(),
      popToTop: jest.fn(),
      replace: jest.fn(),
      resize: jest.fn(),
    }) as unknown as TrueSheetNavigationProp<T>
);

export type { TrueSheetActionType } from '../navigation/TrueSheetRouter';
export type { DetentInfoEventPayload, PositionChangeEventPayload } from '../TrueSheet.types';
export type {
  TrueSheetNavigationEventMap,
  TrueSheetNavigationHelpers,
  TrueSheetNavigationOptions,
  TrueSheetNavigationProp,
  TrueSheetNavigationState,
  TrueSheetScreenProps,
} from '../navigation/types';
