import { StackRouter, type ParamListBase } from '@react-navigation/core';

import { TrueSheetActions } from '../actions';
import { createTrueSheetRouter } from '../createTrueSheetRouter';
import type { StackRouterFactory } from '../types';
import type { TrueSheetNavigationState } from '../types';

type State = TrueSheetNavigationState<ParamListBase>;
type Route = State['routes'][number];

const ROUTE_NAMES = ['Home', 'Details', 'Settings', 'Profile'];

const configOptions = {
  routeNames: ROUTE_NAMES,
  routeParamList: {},
  routeGetIdList: {},
};

const makeRoute = (name: string, extra?: Partial<Route>): Route => ({
  key: `${name}-test`,
  name,
  ...extra,
});

// StackRouter reads `preloadedRoutes` at runtime; TrueSheetNavigationState doesn't model it
const makeState = (
  routes: Route[],
  index = routes.length - 1
): State & { preloadedRoutes: Route[] } => ({
  stale: false,
  type: 'true-sheet',
  key: 'true-sheet-test',
  index,
  routeNames: ROUTE_NAMES,
  routes,
  preloadedRoutes: [],
});

const createRouter = (initialRouteName?: string) =>
  createTrueSheetRouter(StackRouter as StackRouterFactory)({ initialRouteName });

describe('createTrueSheetRouter', () => {
  describe('getInitialState', () => {
    it('creates state with the base route', () => {
      const router = createRouter();
      const state = router.getInitialState(configOptions);

      expect(state.type).toBe('true-sheet');
      expect(state.key).toMatch(/^true-sheet-/);
      expect(state.routes).toHaveLength(1);
      expect(state.routes[0]?.name).toBe('Home');
    });

    it('respects initialRouteName', () => {
      const router = createRouter('Settings');
      const state = router.getInitialState(configOptions);

      expect(state.routes[0]?.name).toBe('Settings');
    });
  });

  describe('getRehydratedState', () => {
    it('prepends a synthetic base route when missing', () => {
      const router = createRouter();
      const state = router.getRehydratedState(
        { stale: true, routes: [{ name: 'Details' }] },
        configOptions
      );

      expect(state.routes.map((r) => r.name)).toEqual(['Home', 'Details']);
      expect(state.index).toBe(1);
      expect(state.routes[0]?.key).toMatch(/^Home-/);
      expect(state.type).toBe('true-sheet');
    });

    it('does not duplicate an existing base route', () => {
      const router = createRouter();
      const state = router.getRehydratedState(
        { stale: true, routes: [{ name: 'Home' }, { name: 'Details' }] },
        configOptions
      );

      expect(state.routes.map((r) => r.name)).toEqual(['Home', 'Details']);
    });

    it('returns non-stale state as-is', () => {
      const router = createRouter();
      const state = makeState([makeRoute('Home')]);

      expect(router.getRehydratedState(state, configOptions)).toBe(state);
    });
  });

  describe('getStateForAction', () => {
    const router = createRouter();

    // The router never returns partial states for these actions
    const getStateForAction = (
      state: State,
      action: Parameters<typeof router.getStateForAction>[1]
    ) => router.getStateForAction(state, action, configOptions) as State | null;

    it('PUSH appends a sheet route', () => {
      const state = makeState([makeRoute('Home')]);
      const nextState = getStateForAction(state, TrueSheetActions.push('Details'));

      expect(nextState?.routes.map((r) => r.name)).toEqual(['Home', 'Details']);
      expect(nextState?.index).toBe(1);
    });

    it('POP marks the bottom-most popped route as closing without removing it', () => {
      const state = makeState([makeRoute('Home'), makeRoute('Details'), makeRoute('Settings')]);
      const nextState = getStateForAction(state, TrueSheetActions.pop());

      expect(nextState?.routes).toHaveLength(3);
      expect(nextState?.index).toBe(2);
      expect(nextState?.routes[2]?.closing).toBe(true);
    });

    it('POP with count marks the correct route as closing', () => {
      const state = makeState([makeRoute('Home'), makeRoute('Details'), makeRoute('Settings')]);
      const nextState = getStateForAction(state, TrueSheetActions.pop(2));

      expect(nextState?.index).toBe(1);
      expect(nextState?.routes[1]?.closing).toBe(true);
      expect(nextState?.routes[2]?.closing).toBeUndefined();
    });

    it('POP clamps count to keep the base route', () => {
      const state = makeState([makeRoute('Home'), makeRoute('Details')]);
      const nextState = getStateForAction(state, TrueSheetActions.pop(5));

      expect(nextState?.index).toBe(1);
      expect(nextState?.routes[1]?.closing).toBe(true);
    });

    it('POP returns null when only the base route remains', () => {
      const state = makeState([makeRoute('Home')]);

      expect(getStateForAction(state, TrueSheetActions.pop())).toBeNull();
    });

    it.each(['GO_BACK', 'DISMISS'] as const)('%s behaves like pop(1)', (type) => {
      const state = makeState([makeRoute('Home'), makeRoute('Details')]);
      const nextState = getStateForAction(state, { type });

      expect(nextState?.routes[1]?.closing).toBe(true);
    });

    it('POP_TO_TOP marks the first sheet as closing', () => {
      const state = makeState([makeRoute('Home'), makeRoute('Details'), makeRoute('Settings')]);
      const nextState = getStateForAction(state, TrueSheetActions.popToTop());

      expect(nextState?.index).toBe(1);
      expect(nextState?.routes[1]?.closing).toBe(true);
    });

    it('POP_TO pops down to the target route', () => {
      const state = makeState([makeRoute('Home'), makeRoute('Details'), makeRoute('Settings')]);
      const nextState = getStateForAction(state, TrueSheetActions.popTo('Details'));

      expect(nextState?.index).toBe(2);
      expect(nextState?.routes[2]?.closing).toBe(true);
    });

    it('POP_TO returns null when the target is not found or not below current', () => {
      const state = makeState([makeRoute('Home'), makeRoute('Details')]);

      expect(getStateForAction(state, TrueSheetActions.popTo('Profile'))).toBeNull();
      expect(getStateForAction(state, TrueSheetActions.popTo('Details'))).toBeNull();
    });

    it('REMOVE with source removes the route and all routes above it', () => {
      const state = makeState(
        [makeRoute('Home'), makeRoute('Details', { closing: true }), makeRoute('Settings')],
        1
      );
      const nextState = getStateForAction(state, {
        ...TrueSheetActions.remove(),
        source: 'Details-test',
      });

      expect(nextState?.routes.map((r) => r.name)).toEqual(['Home']);
      expect(nextState?.index).toBe(0);
    });

    it('REMOVE without source removes the first closing route', () => {
      const state = makeState(
        [makeRoute('Home'), makeRoute('Details', { closing: true }), makeRoute('Settings')],
        1
      );
      const nextState = getStateForAction(state, TrueSheetActions.remove());

      expect(nextState?.routes.map((r) => r.name)).toEqual(['Home']);
    });

    it('REMOVE returns the state unchanged when no route matches', () => {
      const state = makeState([makeRoute('Home'), makeRoute('Details')]);
      const nextState = getStateForAction(state, TrueSheetActions.remove());

      expect(nextState).toBe(state);
    });

    it('RESIZE sets resizeIndex and bumps resizeKey on the current route', () => {
      const state = makeState([makeRoute('Home'), makeRoute('Details')]);

      const resized = getStateForAction(state, TrueSheetActions.resize(1));
      expect(resized?.routes[1]?.resizeIndex).toBe(1);
      expect(resized?.routes[1]?.resizeKey).toBe(1);

      // Resizing to the same detent again still bumps resizeKey
      const resizedAgain = getStateForAction(resized as State, TrueSheetActions.resize(1));
      expect(resizedAgain?.routes[1]?.resizeKey).toBe(2);
    });

    it('RESIZE targets the source route when target matches the state key', () => {
      const state = makeState([makeRoute('Home'), makeRoute('Details'), makeRoute('Settings')]);
      const nextState = getStateForAction(state, {
        ...TrueSheetActions.resize(1),
        source: 'Details-test',
        target: state.key,
      });

      expect(nextState?.routes[1]?.resizeIndex).toBe(1);
      expect(nextState?.routes[2]?.resizeIndex).toBeUndefined();
    });
  });

  describe('TrueSheetActions', () => {
    it('creates plain action objects', () => {
      expect(TrueSheetActions.push('Details', { id: 1 })).toEqual({
        type: 'PUSH',
        payload: { name: 'Details', params: { id: 1 } },
      });
      expect(TrueSheetActions.pop()).toEqual({ type: 'POP', payload: { count: 1 } });
      expect(TrueSheetActions.popTo('Details')).toEqual({
        type: 'POP_TO',
        payload: { name: 'Details', params: undefined, merge: undefined },
      });
      expect(TrueSheetActions.popToTop()).toEqual({ type: 'POP_TO_TOP' });
      expect(TrueSheetActions.replace('Details')).toEqual({
        type: 'REPLACE',
        payload: { name: 'Details', params: undefined },
      });
      expect(TrueSheetActions.resize(1)).toEqual({ type: 'RESIZE', index: 1 });
      expect(TrueSheetActions.dismiss()).toEqual({ type: 'DISMISS' });
      expect(TrueSheetActions.remove()).toEqual({ type: 'REMOVE' });
    });
  });
});
