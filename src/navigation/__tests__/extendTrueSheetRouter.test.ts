import { TrueSheetActions, type TrueSheetActionType } from '../actions';
import {
  extendTrueSheetRouter,
  type ExtendRouter,
  type Unhandled,
} from '../expo-router/extendTrueSheetRouter';
import type { TrueSheetRouterState } from '../expo-router/types';

type Route = TrueSheetRouterState['routes'][number];
type Extension = {
  getStateForAction(
    state: TrueSheetRouterState,
    action: TrueSheetActionType,
    config: object
  ): { state: TrueSheetRouterState; affectedRouteKey?: string } | null;
  actionCreators: typeof TrueSheetActions;
};

const stackRouter = jest.fn() as unknown as Parameters<typeof extendTrueSheetRouter>[1];

const makeState = (names: string[]): TrueSheetRouterState => ({
  stale: false,
  type: 'true-sheet',
  key: 'true-sheet-test',
  index: names.length - 1,
  routeNames: ['Home', 'Details', 'Settings'],
  routes: names.map((name): Route => ({ key: `${name}-test`, name })),
});

const createExtension = (initialRouteName?: string) => {
  const extendRouter = jest.fn<ReturnType<ExtendRouter>, Parameters<ExtendRouter>>();
  const baseRouter = { getStateForAction: jest.fn((): Unhandled => 'UNHANDLED') };

  extendTrueSheetRouter(extendRouter, stackRouter, 'UNHANDLED');
  const extension = extendRouter.mock.calls[0]![1]({
    baseRouter,
    options: { initialRouteName },
  }) as Extension;

  return { extendRouter, baseRouter, extension };
};

describe('extendTrueSheetRouter', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('extends the stack router with the true-sheet type', () => {
    const { extendRouter } = createExtension('Home');

    expect(extendRouter).toHaveBeenCalledWith(stackRouter, expect.any(Function), {
      type: 'true-sheet',
    });
  });

  it('warns when the layout has no anchor', () => {
    createExtension();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('unstable_settings.anchor');
  });

  it('does not warn when the layout has an anchor', () => {
    createExtension('Home');

    expect(warn).not.toHaveBeenCalled();
  });

  it('exposes the sheet action creators', () => {
    expect(createExtension('Home').extension.actionCreators).toBe(TrueSheetActions);
  });

  it('delegates non-sheet actions to the base router', () => {
    const { baseRouter, extension } = createExtension('Home');
    const state = makeState(['Home']);
    const action = TrueSheetActions.push('Details');
    const config = {};

    extension.getStateForAction(state, action, config);

    expect(baseRouter.getStateForAction).toHaveBeenCalledWith(state, action, config);
  });

  it('returns UNHANDLED without delegating when a sheet action is rejected', () => {
    const { baseRouter, extension } = createExtension('Home');

    expect(extension.getStateForAction(makeState(['Home']), TrueSheetActions.pop(), {})).toBe(
      'UNHANDLED'
    );
    expect(baseRouter.getStateForAction).not.toHaveBeenCalled();
  });

  it('RESIZE reports the resized route as affected', () => {
    const { extension } = createExtension('Home');
    const state = makeState(['Home', 'Details', 'Settings']);
    const result = extension.getStateForAction(
      state,
      { ...TrueSheetActions.resize(1), source: 'Details-test', target: state.key },
      {}
    );

    expect(result?.affectedRouteKey).toBe('Details-test');
    expect(result?.state.routes[1]?.resizeIndex).toBe(1);
  });

  it('POP keeps the top sheet focused, so the popped routes are not preloaded', () => {
    const { extension } = createExtension('Home');
    const result = extension.getStateForAction(
      makeState(['Home', 'Details', 'Settings']),
      TrueSheetActions.pop(2),
      {}
    );

    expect(result?.affectedRouteKey).toBe('Settings-test');
    expect(result?.state.index).toBe(2);
    expect(result?.state.routes[1]?.closing).toBe(true);
    expect(result?.state.routes[2]?.dismissing).toBe(true);
  });

  it('ignores PRELOAD, which would present the sheet', () => {
    const { baseRouter, extension } = createExtension('Home');
    const state = makeState(['Home']);
    const result = extension.getStateForAction(
      state,
      { type: 'PRELOAD', payload: { name: 'Details' } } as unknown as TrueSheetActionType,
      {}
    );

    expect(result).toEqual({ state });
    expect(baseRouter.getStateForAction).not.toHaveBeenCalled();
  });

  it('leaves a PRELOAD of a parent navigator route unhandled, so it bubbles up', () => {
    const { baseRouter, extension } = createExtension('Home');
    const result = extension.getStateForAction(
      makeState(['Home']),
      { type: 'PRELOAD', payload: { name: 'Profile' } } as unknown as TrueSheetActionType,
      {}
    );

    expect(result).toBe('UNHANDLED');
    expect(baseRouter.getStateForAction).not.toHaveBeenCalled();
  });

  describe('an action to the base route', () => {
    const action = {
      type: 'NAVIGATE',
      payload: { name: 'Home', params: { screen: 'Test' } },
    } as unknown as TrueSheetActionType;
    const popAction = {
      type: 'NAVIGATE',
      payload: { name: 'Home', params: { screen: 'Test' }, pop: true },
    };
    const home: Route = { key: 'Home-test', name: 'Home', params: { screen: 'Test' } };

    it('goes back to it and dismisses the sheets, with the base route affected', () => {
      const { baseRouter, extension } = createExtension('Home');
      const state = makeState(['Home', 'Details', 'Settings']);
      baseRouter.getStateForAction.mockReturnValueOnce({
        state: { ...state, index: 0, routes: [home] },
        affectedRouteKey: 'Home-test',
      } as never);

      const result = extension.getStateForAction(state, action, {});

      expect(baseRouter.getStateForAction).toHaveBeenCalledWith(state, popAction, {});
      expect(result?.affectedRouteKey).toBe('Home-test');
      expect(result?.state.routes[0]).toBe(home);
      expect(result?.state.index).toBe(2);
      expect(result?.state.routes[1]?.closing).toBe(true);
      expect(result?.state.routes[2]?.dismissing).toBe(true);
    });

    it('updates the base route while the sheets are dismissing', () => {
      const { baseRouter, extension } = createExtension('Home');
      const [base, details, settings] = makeState(['Home', 'Details', 'Settings']).routes;
      const state = {
        ...makeState([]),
        index: 2,
        routes: [base!, { ...details!, closing: true }, { ...settings!, dismissing: true }],
      };
      baseRouter.getStateForAction.mockReturnValueOnce({
        state: { ...state, index: 0, routes: [home] },
        affectedRouteKey: 'Home-test',
      } as never);

      const result = extension.getStateForAction(state, action, {});

      expect(result?.affectedRouteKey).toBe('Home-test');
      expect(result?.state.routes).toHaveLength(3);
      expect(result?.state.routes[0]).toBe(home);
      expect(result?.state.routes[1]?.closing).toBe(true);
      expect(result?.state.routes[2]?.dismissing).toBe(true);
    });

    it.each(['PUSH', 'REPLACE', 'POP_TO'])(
      'handles a %s of the base route as a NAVIGATE',
      (type) => {
        const { baseRouter, extension } = createExtension('Home');
        const state = makeState(['Home', 'Details']);
        baseRouter.getStateForAction.mockReturnValueOnce({
          state: { ...state, index: 0, routes: [home] },
          affectedRouteKey: 'Home-test',
        } as never);

        const result = extension.getStateForAction(
          state,
          { ...action, type } as unknown as TrueSheetActionType,
          {}
        );

        expect(baseRouter.getStateForAction).toHaveBeenCalledWith(state, popAction, {});
        expect(result?.affectedRouteKey).toBe('Home-test');
        expect(result?.state.routes[0]).toBe(home);
        expect(result?.state.index).toBe(1);
        expect(result?.state.routes[1]?.closing).toBe(true);
      }
    );

    it('updates the base route for a PUSH with no sheet', () => {
      const { baseRouter, extension } = createExtension('Home');
      const state = makeState(['Home']);
      const updated = { ...state, routes: [home] };
      baseRouter.getStateForAction.mockReturnValueOnce({
        state: updated,
        affectedRouteKey: 'Home-test',
      } as never);

      const result = extension.getStateForAction(
        state,
        { ...action, type: 'PUSH' } as unknown as TrueSheetActionType,
        {}
      );

      expect(baseRouter.getStateForAction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ state: updated, affectedRouteKey: 'Home-test' });
    });

    it.each(['NAVIGATE', 'PUSH'])(
      'delegates a %s as is when the base router does not land on the base route',
      (type) => {
        const { baseRouter, extension } = createExtension('Home');
        const state = makeState(['Home', 'Details']);
        const typedAction = { ...action, type } as unknown as TrueSheetActionType;
        baseRouter.getStateForAction.mockReturnValueOnce({
          state: {
            ...state,
            index: 2,
            routes: [...state.routes, { key: 'Home-new', name: 'Home' }],
          },
          affectedRouteKey: 'Home-new',
        } as never);

        extension.getStateForAction(state, typedAction, {});

        expect(baseRouter.getStateForAction).toHaveBeenNthCalledWith(2, state, typedAction, {});
      }
    );

    it('delegates the action as is when the base router leaves the pop unhandled', () => {
      const { baseRouter, extension } = createExtension('Home');
      const state = makeState(['Home', 'Details']);

      expect(extension.getStateForAction(state, action, {})).toBe('UNHANDLED');
      expect(baseRouter.getStateForAction).toHaveBeenNthCalledWith(1, state, popAction, {});
      expect(baseRouter.getStateForAction).toHaveBeenNthCalledWith(2, state, action, {});
    });
  });

  it('REMOVE reports the focused route as affected', () => {
    const { extension } = createExtension('Home');
    const result = extension.getStateForAction(
      makeState(['Home', 'Details']),
      { ...TrueSheetActions.remove(), source: 'Details-test' },
      {}
    );

    expect(result?.affectedRouteKey).toBe('Home-test');
    expect(result?.state.routes.map((r) => r.name)).toEqual(['Home']);
  });
});
