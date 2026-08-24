import type { ParamListBase } from '@react-navigation/native';

import type { TrueSheetNavigationProp } from '../navigation/types';
import {
  TrueSheetActions,
  useTrueSheetNavigation as useTrueSheetNavigationMock,
} from './navigation';

/**
 * Mock Sheet layout for testing.
 * Import from '@lodev09/react-native-true-sheet/navigation/expo-router/mock' in your test setup.
 */
export const Sheet = Object.assign(
  jest.fn(({ children }: { children: React.ReactNode }) => children),
  {
    Screen: jest.fn(() => null),
    Protected: jest.fn(() => null),
  }
);

/**
 * Mock useTrueSheetNavigation hook for testing.
 */
export const useTrueSheetNavigation = jest.fn(
  <T extends ParamListBase = ParamListBase>(): TrueSheetNavigationProp<T> =>
    useTrueSheetNavigationMock() as TrueSheetNavigationProp<T>
);

export { TrueSheetActions };

export type { TrueSheetActionType } from '../navigation/actions';
export type { DetentInfoEventPayload, PositionChangeEventPayload } from '../TrueSheet.types';
export type {
  TrueSheetNavigationEventMap,
  TrueSheetNavigationHelpers,
  TrueSheetNavigationOptions,
  TrueSheetNavigationProp,
  TrueSheetNavigationState,
  TrueSheetScreenProps,
} from '../navigation/types';
