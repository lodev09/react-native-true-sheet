import { StackRouter, unstable_integrateWithRouter, useNavigation } from 'expo-router';

import { createTrueSheetRouter } from '../createTrueSheetRouter';
import { trueSheetNavigator } from '../navigator';
import type { ParamListBase } from './base-types';
import type {
  StackRouterFactory,
  TrueSheetNavigationOptions,
  TrueSheetNavigationProp,
  TrueSheetNavigationState,
  TrueSheetNavigatorContentExtraProps,
  TrueSheetNavigatorProps,
  TrueSheetRouterFactory,
  TrueSheetRouterOptions,
  TrueSheetStandardEventMap,
} from './types';

// expo-router's vendored StackRouter is structurally identical to @react-navigation's.
// Pinned to this entry's own router types: `createTrueSheetRouter` is shared and typed
// against React Navigation, which resolves to `any` in apps that only install expo-router.
const sheetRouter: TrueSheetRouterFactory = createTrueSheetRouter(
  StackRouter as StackRouterFactory
);

const SheetNavigator = unstable_integrateWithRouter<
  TrueSheetNavigationOptions,
  TrueSheetNavigationState<ParamListBase>,
  TrueSheetStandardEventMap,
  TrueSheetNavigatorContentExtraProps,
  TrueSheetRouterOptions
>(trueSheetNavigator, sheetRouter, {
  createProps: ({ state, dispatch }) => ({
    routes: state.routes,
    dispatch,
  }),
});

// Public props: `routes`/`dispatch` are injected by `createProps` (optional here
// so the navigator type stays comparable), and expo-router intersects the event
// map with an index signature which breaks precisely typed `screenListeners`
// callbacks - replace it with the exact map
type SheetProps = Omit<
  React.ComponentProps<typeof SheetNavigator>,
  'screenListeners' | 'routes' | 'dispatch'
> &
  Partial<Pick<React.ComponentProps<typeof SheetNavigator>, 'routes' | 'dispatch'>> &
  Pick<TrueSheetNavigatorProps, 'screenListeners'>;

/**
 * TrueSheet navigator layout for Expo Router.
 *
 * @example
 * ```tsx
 * // app/sheet/_layout.tsx
 * import { Sheet } from '@lodev09/react-native-true-sheet/navigation/expo-router';
 *
 * export default function SheetLayout() {
 *   return (
 *     <Sheet initialRouteName="(home)">
 *       <Sheet.Screen name="details" options={{ detents: [0.5, 1] }} />
 *     </Sheet>
 *   );
 * }
 * ```
 */
export const Sheet = SheetNavigator as React.ComponentType<SheetProps> & {
  Screen: typeof SheetNavigator.Screen;
  Protected: typeof SheetNavigator.Protected;
};

/**
 * Hook to access TrueSheet navigation with the resize helper.
 * Built on expo-router's `useNavigation`.
 */
export const useTrueSheetNavigation = <
  T extends ParamListBase = ParamListBase,
>(): TrueSheetNavigationProp<T> => useNavigation<TrueSheetNavigationProp<T>>();

export { TrueSheetActions, type TrueSheetActionType } from '../actions';

export type { DetentInfoEventPayload, PositionChangeEventPayload } from '../../TrueSheet.types';

export type {
  TrueSheetNavigationEventMap,
  TrueSheetNavigationHelpers,
  TrueSheetNavigationOptions,
  TrueSheetNavigationProp,
  TrueSheetNavigationState,
  TrueSheetScreenProps,
} from './types';
