import { TrueSheetActions, type TrueSheetActionType } from '../actions';
import { getTrueSheetStateForAction } from '../createTrueSheetRouter';
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
    ({ baseRouter }) => ({
      getStateForAction(
        state: TrueSheetRouterState,
        action: TrueSheetActionType,
        options: object
      ): ActionResult | null {
        const result = getTrueSheetStateForAction(state, action);

        if (result === undefined) {
          return baseRouter.getStateForAction(state, action, options);
        }

        return result && { state: result, affectedRouteKey: result.routes[result.index]?.key };
      },
      actionCreators: TrueSheetActions,
    }),
    { type: 'true-sheet' }
  );
