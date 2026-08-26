import type { ParamListBase } from '../navigation/expo-router/base-types';
import type { TrueSheetNavigationProp } from '../navigation/expo-router/types';
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
  // Double cast: the shared mock is typed against React Navigation, this entry
  // against Expo Router's vendored copy — identical shapes, unrelated declarations
  <T extends ParamListBase = ParamListBase>(): TrueSheetNavigationProp<T> =>
    useTrueSheetNavigationMock() as unknown as TrueSheetNavigationProp<T>
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
} from '../navigation/expo-router/types';
