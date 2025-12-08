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

      return {
        ...state,
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
          // Actually remove the closing route
          const routeKey = action.source;
          const routeIndex = routeKey
            ? state.routes.findIndex((r) => r.key === routeKey)
            : state.routes.findIndex((r) => r.closing);

          if (routeIndex === -1) {
            return state;
          }

          const routes = state.routes.filter((_, i) => i !== routeIndex);

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

      return {
        ...state,
        type: 'true-sheet',
        key: `true-sheet-${nanoid()}`,
      };
    },

    actionCreators: TrueSheetActions,
  };
};
