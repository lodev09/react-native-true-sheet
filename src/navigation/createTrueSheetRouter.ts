import { TrueSheetActions, type TrueSheetActionType } from './actions';
import type { TrueSheetRouter, TrueSheetRouterFactory, TrueSheetRouterOptions } from './types';

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

type SheetRoute = {
  key: string;
  name: string;
  closing?: boolean;
  dismissing?: boolean;
  resizeIndex?: number;
  resizeKey?: number;
};
type SheetState = { key: string; index: number; routes: SheetRoute[] };

/**
 * Index of the route a `RESIZE` targets: the dispatching screen, else the focused route.
 */
export const getResizeRouteIndex = (
  state: SheetState,
  action: { source?: string; target?: string }
): number =>
  action.target === state.key && action.source
    ? state.routes.findIndex((r) => r.key === action.source)
    : state.index;

/**
 * Reduces the sheet-specific actions shared by every router flavour.
 * Returns `undefined` for actions the base `StackRouter` should handle.
 */
export const getTrueSheetStateForAction = <State extends SheetState>(
  state: State,
  action: TrueSheetActionType
): State | null | undefined => {
  switch (action.type) {
    case 'RESIZE': {
      const routeIndex = getResizeRouteIndex(state, action);

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
      return getTrueSheetStateForAction(state, TrueSheetActions.pop(1));
    }

    case 'POP': {
      // Only base screen remains - let parent navigator handle it
      if (state.routes.length <= 1) {
        return null;
      }

      const count =
        'payload' in action && typeof action.payload?.count === 'number' ? action.payload.count : 1;

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
        routes: state.routes.map((route, i) => {
          if (i === closingIndex) return { ...route, closing: true };
          if (i > closingIndex) return { ...route, dismissing: true };
          return route;
        }),
      };
    }

    case 'POP_TO_TOP': {
      const popCount = state.routes.length - 1;
      return getTrueSheetStateForAction(state, TrueSheetActions.pop(popCount));
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
      return getTrueSheetStateForAction(state, TrueSheetActions.pop(popCount));
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

      // Remove the route and the routes dismissed with it. A popped route keeps the
      // routes pushed after the pop started: they aren't stacked on it natively.
      const removed = state.routes[routeIndex]!;
      const isPopped = removed.closing || removed.dismissing;
      const routes = state.routes.filter(
        (route, i) => i < routeIndex || (i > routeIndex && isPopped && !route.dismissing)
      );

      return {
        ...state,
        index: Math.min(state.index, routes.length - 1),
        routes,
      };
    }

    default:
      return undefined;
  }
};

export const createTrueSheetRouter =
  (stackRouter: TrueSheetRouterFactory) =>
  (routerOptions: TrueSheetRouterOptions): TrueSheetRouter => {
    const baseRouter = stackRouter(routerOptions);

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
        const result = getTrueSheetStateForAction(state, action);

        return result === undefined ? baseRouter.getStateForAction(state, action, options) : result;
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
