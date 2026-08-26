import {
  createStandardNavigationFactories,
  StackRouter,
  type StandardNavigationTypeBagBase,
} from '@react-navigation/native';

import { createTrueSheetRouter } from './createTrueSheetRouter';
import { trueSheetNavigator } from './navigator';
import type {
  StackRouterFactory,
  TrueSheetActionHelpers,
  TrueSheetNavigationOptions,
  TrueSheetNavigationEventMap,
  TrueSheetNavigationState,
  TrueSheetNavigatorContentExtraProps,
  TrueSheetRouterOptions,
} from './types';

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
export { createTrueSheetRouter } from './createTrueSheetRouter';
export { useTrueSheetNavigation } from './useTrueSheetNavigation';

export type { DetentInfoEventPayload, PositionChangeEventPayload } from '../TrueSheet.types';

export type {
  StackRouterFactory,
  TrueSheetNavigationEventMap,
  TrueSheetNavigationHelpers,
  TrueSheetNavigationOptions,
  TrueSheetNavigationProp,
  TrueSheetNavigationState,
  TrueSheetRouterOptions,
  TrueSheetScreenProps,
} from './types';
