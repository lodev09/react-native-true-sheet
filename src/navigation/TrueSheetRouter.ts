import { nanoid } from 'nanoid/non-secure';
import {
  type CommonActions,
  type ParamListBase,
  type Router,
  StackRouter,
  type StackActionType,
  StackActions,
  type StackRouterOptions,
} from '@react-navigation/native';

import type { TrueSheetNavigationState } from './types';

export type TrueSheetRouterOptions = StackRouterOptions;

export type TrueSheetActionType =
  | StackActionType
  | ReturnType<typeof CommonActions.goBack>
  | {
      type: 'RESIZE';
      index: number;
      source?: string;
      target?: string;
    }
  | {
      type: 'DISMISS';
      source?: string;
      target?: string;
    }
  | {
      type: 'REMOVE';
      source?: string;
      target?: string;
    };

export const TrueSheetActions = {
  ...StackActions,
  resize: (index: number): TrueSheetActionType => ({ type: 'RESIZE', index }),
  dismiss: (): TrueSheetActionType => ({ type: 'DISMISS' }),
  remove: (): TrueSheetActionType => ({ type: 'REMOVE' }),
};

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
      key: `${baseRouteName}-${nanoid()}`,
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

export const TrueSheetRouter = (
  routerOptions: StackRouterOptions
): Router<TrueSheetNavigationState<ParamListBase>, TrueSheetActionType> => {
  const baseRouter = StackRouter(routerOptions) as unknown as Router<
    TrueSheetNavigationState<ParamListBase>,
    TrueSheetActionType
  >;

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
        key: `true-sheet-${nanoid()}`,
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
        case 'POP':
        case 'DISMISS': {
          // Only base screen remains - let parent navigator handle it
          if (state.routes.length <= 1) {
            return null;
          }

          // Find the route to dismiss
          const routeIndex =
            action.target === state.key && 'source' in action && action.source
              ? state.routes.findIndex((r) => r.key === action.source)
              : state.index;

          // Base screen - let parent navigator handle it
          if (routeIndex === 0) {
            return null;
          }

          // Mark the route as closing instead of removing it
          return {
            ...state,
            routes: state.routes.map((route, i) =>
              i === routeIndex
                ? {
                    ...route,
                    closing: true,
                  }
                : route
            ),
          };
        }

        case 'REMOVE': {
          const routeKey = action.source;
          const routeIndex = routeKey
            ? state.routes.findIndex((r) => r.key === routeKey)
            : state.routes.findIndex((r) => r.closing);

          if (routeIndex === -1) {
            return state;
          }

          const popToTargetIndex = state.popToTargetIndex;

          // If we have a popToTargetIndex, remove ALL routes above the target at once
          if (popToTargetIndex !== undefined) {
            const routes = state.routes
              .filter((_, i) => i <= popToTargetIndex)
              .map((route) => ({ ...route, closing: false, cascadeRemoving: false }));

            return {
              ...state,
              popToTargetIndex: undefined,
              index: Math.min(state.index, routes.length - 1),
              routes,
            };
          }

          // Normal single route removal
          const routes = state.routes.filter((_, i) => i !== routeIndex);
          return {
            ...state,
            index: Math.min(state.index, routes.length - 1),
            routes,
          };
        }

        case 'POP_TO': {
          const targetName = 'payload' in action ? action.payload?.name : undefined;

          if (!targetName) {
            return state;
          }

          // Find the target route index
          const targetIndex = state.routes.findIndex((r) => r.name === targetName);

          // Target not found - let parent navigator handle it
          if (targetIndex === -1) {
            return null;
          }

          // No routes to pop (target is current or above)
          if (targetIndex >= state.index) {
            return state;
          }

          // Only base screen remains - nothing to pop
          if (state.routes.length <= 1) {
            return state;
          }

          // Mark the LOWEST sheet above target as closing (it will call dismiss)
          // Mark all sheets ABOVE it as cascadeRemoving (they won't call dismiss)
          // Both iOS and Android will cascade-dismiss all sheets in one animation
          const lowestSheetToClose = targetIndex + 1;

          return {
            ...state,
            popToTargetIndex: targetIndex,
            routes: state.routes.map((route, i) => {
              if (i === lowestSheetToClose) {
                return { ...route, closing: true };
              }
              if (i > lowestSheetToClose) {
                return { ...route, cascadeRemoving: true };
              }
              return route;
            }),
          };
        }

        case 'POP_TO_TOP': {
          // Only base screen remains - nothing to pop
          if (state.routes.length <= 1) {
            return state;
          }

          // Mark the LOWEST sheet (index 1) as closing (it will call dismiss)
          // Mark all sheets ABOVE it as cascadeRemoving (they won't call dismiss)
          // Both iOS and Android will cascade-dismiss all sheets in one animation
          const lowestSheetToClose = 1;

          return {
            ...state,
            popToTargetIndex: 0,
            routes: state.routes.map((route, i) => {
              if (i === lowestSheetToClose) {
                return { ...route, closing: true };
              }
              if (i > lowestSheetToClose) {
                return { ...route, cascadeRemoving: true };
              }
              return route;
            }),
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
        key: `true-sheet-${nanoid()}`,
      };
    },

    actionCreators: TrueSheetActions,
  };
};
