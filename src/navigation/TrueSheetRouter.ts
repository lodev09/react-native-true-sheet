import { nanoid } from 'nanoid/non-secure';
import {
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
  | {
      type: 'RESIZE';
      index: number;
      source?: string;
      target?: string;
    };

export const TrueSheetActions = {
  ...StackActions,
  resize(index: number): TrueSheetActionType {
    return { type: 'RESIZE', index };
  },
};

export function TrueSheetRouter(
  routerOptions: StackRouterOptions
): Router<TrueSheetNavigationState<ParamListBase>, TrueSheetActionType> {
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
          const index =
            action.target === state.key && action.source
              ? state.routes.findIndex((r) => r.key === action.source)
              : state.index;

          return {
            ...state,
            routes: state.routes.map((route, i) =>
              i === index
                ? {
                    ...route,
                    resizeIndex: action.index,
                  }
                : route
            ),
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
}
