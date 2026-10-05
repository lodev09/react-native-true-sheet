import { TrueSheetActions, type TrueSheetActionType } from '../actions';
import { getResizeRouteIndex, getTrueSheetStateForAction } from '../createTrueSheetRouter';
import type { StackRouterFactory, TrueSheetRouterFactory, TrueSheetRouterState } from './types';

type ActionResult = { state: TrueSheetRouterState; affectedRouteKey?: string };

type RouterExtension = (context: {
  baseRouter: {
    getStateForAction(
      state: TrueSheetRouterState,
      action: TrueSheetActionType,
      options: object
    ): ActionResult | null;
  };
  options: { initialRouteName?: string };
}) => object;

/**
 * `extendRouter` from Expo Router 58+. Declared locally because the
 * Expo Router types this package builds against predate it.
 */
export type ExtendRouter = (
  base: StackRouterFactory,
  extension: RouterExtension,
  options: { type: string }
) => TrueSheetRouterFactory;

/**
 * Router for Expo Router 58+, where navigator state is seeded by Expo Router
 * (no `getInitialState`/`getRehydratedState`) and `getStateForAction` returns
 * `{ state, affectedRouteKey }`.
 */
export const extendTrueSheetRouter = (
  extendRouter: ExtendRouter,
  stackRouter: StackRouterFactory
): TrueSheetRouterFactory =>
  extendRouter(
    stackRouter,
    ({ baseRouter, options }) => {
      if (__DEV__ && options.initialRouteName === undefined) {
        console.warn(
          "TrueSheet: this Sheet layout has no `unstable_settings.anchor`. On Expo Router 58+, a sheet route opened directly (deep link or push from another navigator) renders without its base screen. Export `unstable_settings = { anchor: '<base route>' }` from the layout."
        );
      }

      return {
        getStateForAction(
          state: TrueSheetRouterState,
          action: TrueSheetActionType,
          config: object
        ): ActionResult | null {
          const result = getTrueSheetStateForAction(state, action);

          if (result === undefined) {
            return baseRouter.getStateForAction(state, action, config);
          }

          if (result === null) {
            return null;
          }

          const affectedIndex =
            action.type === 'RESIZE' ? getResizeRouteIndex(state, action) : result.index;

          return { state: result, affectedRouteKey: result.routes[affectedIndex]?.key };
        },
        actionCreators: TrueSheetActions,
      };
    },
    { type: 'true-sheet' }
  );
