import {
  createStandardNavigationFactories,
  StackRouter,
  type StandardNavigationTypeBagBase,
} from '@react-navigation/native';

import { createTrueSheetRouter, type StackRouterFactory } from './createTrueSheetRouter';
import { trueSheetNavigator } from './navigator';
import type {
  TrueSheetActionHelpers,
  TrueSheetNavigationOptions,
  TrueSheetNavigationEventMap,
  TrueSheetNavigationState,
  TrueSheetNavigatorContentExtraProps,
} from './types';
import type { TrueSheetRouterOptions } from './createTrueSheetRouter';

export interface TrueSheetNavigationTypeBag extends StandardNavigationTypeBagBase {
  State: TrueSheetNavigationState<this['ParamList']>;
  ActionHelpers: TrueSheetActionHelpers<this['ParamList']>;
  ScreenOptions: TrueSheetNavigationOptions;
  EventMap: TrueSheetNavigationEventMap;
  RouterOptions: TrueSheetRouterOptions;
}

const { createNavigator, createScreen } = createStandardNavigationFactories<
  TrueSheetNavigationTypeBag,
  {},
  TrueSheetNavigatorContentExtraProps
>(
  trueSheetNavigator,
  createTrueSheetRouter(StackRouter as StackRouterFactory),
  ({ state, navigation }) => ({ routes: state.routes, dispatch: navigation.dispatch })
);

/**
 * Creates a TrueSheet navigator.
 *
 * @example
 * ```tsx
 * const Sheet = createTrueSheetNavigator();
 *
 * function App() {
 *   return (
 *     <Sheet.Navigator>
 *       <Sheet.Screen name="Home" component={HomeScreen} />
 *       <Sheet.Screen
 *         name="Details"
 *         component={DetailsSheet}
 *         options={{ detents: [0.5, 1] }}
 *       />
 *     </Sheet.Navigator>
 *   );
 * }
 * ```
 */
export const createTrueSheetNavigator = createNavigator;

/**
 * Creates a screen configuration for the static API.
 */
export const createTrueSheetScreen = createScreen;

export { TrueSheetActions, type TrueSheetActionType } from './actions';
export {
  createTrueSheetRouter,
  type StackRouterFactory,
  type TrueSheetRouterOptions,
} from './createTrueSheetRouter';
export { useTrueSheetNavigation } from './useTrueSheetNavigation';

export type { DetentInfoEventPayload, PositionChangeEventPayload } from '../TrueSheet.types';

export type {
  TrueSheetNavigationEventMap,
  TrueSheetNavigationHelpers,
  TrueSheetNavigationOptions,
  TrueSheetNavigationProp,
  TrueSheetNavigationState,
  TrueSheetScreenProps,
} from './types';
