import { TrueSheetActions, type TrueSheetActionType } from './actions';
import type {
  NavigationAction,
  NavigationState,
  ParamListBase,
  Router,
  StackRouterOptions,
} from './base-types';
import type { TrueSheetNavigationState } from './types';

export type TrueSheetRouterOptions = StackRouterOptions;

/**
 * The base `StackRouter` factory to wrap, typed generically over the state and
 * action types the wrapper threads through — `StackRouter` is structural and
 * never touches the sheet-specific fields.
 * Injected by each entry point so the shared router never imports
 * `@react-navigation/*` at runtime (Expo Router apps don't install it).
 */
export type StackRouterFactory = <
  State extends NavigationState<ParamListBase>,
  Action extends NavigationAction,
>(
  options: TrueSheetRouterOptions
) => Router<State, Action>;

const uid = () => Math.random().toString(36).slice(2, 10);

const ensureBaseRoute = <T extends { routes: { name: string }[] }>(
  state: T,
  baseRouteName: string | undefined,
  routeParamList: Record<string, object | undefined> | undefined
): T & { index: number; routes: T['routes'] } => {
  if (!baseRouteName) {
    return state as T & { index: number; routes: T['routes'] };
  }

  const hasBaseRoute = state.routes.some((r) => r.name === baseRouteName);

  if (!hasBaseRoute) {
    const baseRoute = {
      key: `${baseRouteName}-${uid()}`,
      name: baseRouteName,
      params: routeParamList?.[baseRouteName],
    };

    return {
      ...state,
      index: state.routes.length,
      routes: [baseRoute, ...state.routes],
    } as T & { index: number; routes: T['routes'] };
  }

  return state as T & { index: number; routes: T['routes'] };
};

export const createTrueSheetRouter =
  (stackRouter: StackRouterFactory) =>
  (
    routerOptions: TrueSheetRouterOptions
  ): Router<TrueSheetNavigationState<ParamListBase>, TrueSheetActionType> => {
    const baseRouter = stackRouter<TrueSheetNavigationState<ParamListBase>, TrueSheetActionType>(
      routerOptions
    );

    return {
      ...baseRouter,
      type: 'true-sheet',

      getInitialState(options) {
        const state = baseRouter.getInitialState(options);
        const baseRouteName = routerOptions.initialRouteName ?? options.routeNames[0];
        const stateWithBaseRoute = ensureBaseRoute(state, baseRouteName, options.routeParamList);

        return {
          ...stateWithBaseRoute,
          stale: false,
          type: 'true-sheet',
          key: `true-sheet-${uid()}`,
        };
      },

      getStateForAction(state, action, options) {
        switch (action.type) {
          case 'RESIZE': {
            const routeIndex =
              action.target === state.key && action.source
                ? state.routes.findIndex((r) => r.key === action.source)
                : state.index;

            return {
              ...state,
              routes: state.routes.map((route, i) =>
                i === routeIndex
                  ? {
                      ...route,
                      resizeIndex: action.index,
                      resizeKey: (route.resizeKey ?? 0) + 1,
                    }
                  : route
              ),
            };
          }

          case 'GO_BACK':
          case 'DISMISS': {
            return this.getStateForAction(state, TrueSheetActions.pop(1), options);
          }

          case 'POP': {
            // Only base screen remains - let parent navigator handle it
            if (state.routes.length <= 1) {
              return null;
            }

            const count =
              'payload' in action && typeof action.payload?.count === 'number'
                ? action.payload.count
                : 1;

            // Calculate how many routes we can actually pop (don't pop base screen)
            const maxPopCount = state.routes.length - 1;
            const actualCount = Math.min(count, maxPopCount);

            // Base screen - let parent navigator handle it
            if (actualCount <= 0) {
              return null;
            }

            // Target index is the route we want to stay on (land on after pop)
            // closingIndex is the first route to be dismissed (the one after target)
            const targetIndex = state.routes.length - 1 - actualCount;
            const closingIndex = targetIndex + 1;

            // Mark only the bottom-most route to pop as closing
            // The sheet's dismiss() will handle dismissing sheets above it first
            return {
              ...state,
              index: closingIndex,
              routes: state.routes.map((route, i) =>
                i === closingIndex ? { ...route, closing: true } : route
              ),
            };
          }

          case 'POP_TO_TOP': {
            const popCount = state.routes.length - 1;
            return this.getStateForAction(state, TrueSheetActions.pop(popCount), options);
          }

          case 'POP_TO': {
            const targetName =
              'payload' in action && typeof action.payload?.name === 'string'
                ? action.payload.name
                : null;

            if (!targetName) {
              return null;
            }

            const targetIndex = state.routes.findIndex((r) => r.name === targetName);

            // Target not found or is the current route
            if (targetIndex === -1 || targetIndex >= state.index) {
              return null;
            }

            const popCount = state.routes.length - 1 - targetIndex;
            return this.getStateForAction(state, TrueSheetActions.pop(popCount), options);
          }

          case 'REMOVE': {
            // Actually remove the closing route and all routes above it
            const routeKey = action.source;
            const routeIndex = routeKey
              ? state.routes.findIndex((r) => r.key === routeKey)
              : state.routes.findIndex((r) => r.closing);

            if (routeIndex === -1) {
              return state;
            }

            // Remove the route and all routes above it (they were dismissed together)
            const routes = state.routes.filter((_, i) => i < routeIndex);

            return {
              ...state,
              index: Math.min(state.index, routes.length - 1),
              routes,
            };
          }

          default:
            return baseRouter.getStateForAction(state, action, options);
        }
      },

      getRehydratedState(partialState, { routeNames, routeParamList, routeGetIdList }) {
        if (partialState.stale === false) {
          return partialState;
        }

        const state = baseRouter.getRehydratedState(partialState, {
          routeNames,
          routeParamList,
          routeGetIdList,
        });

        const baseRouteName = routerOptions.initialRouteName ?? routeNames[0];
        const stateWithBaseRoute = ensureBaseRoute(state, baseRouteName, routeParamList);

        return {
          ...stateWithBaseRoute,
          type: 'true-sheet',
          key: `true-sheet-${uid()}`,
        };
      },

      actionCreators: TrueSheetActions,
    };
  };
