import { TrueSheetActions, type TrueSheetActionType } from '../actions';
import { extendTrueSheetRouter, type ExtendRouter } from '../expo-router/extendTrueSheetRouter';
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
  const baseRouter = { getStateForAction: jest.fn(() => null) };

  extendTrueSheetRouter(extendRouter, stackRouter);
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

  it('returns null without delegating when a sheet action is rejected', () => {
    const { baseRouter, extension } = createExtension('Home');

    expect(extension.getStateForAction(makeState(['Home']), TrueSheetActions.pop(), {})).toBeNull();
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

  it('POP reports the closing route as affected', () => {
    const { extension } = createExtension('Home');
    const result = extension.getStateForAction(
      makeState(['Home', 'Details', 'Settings']),
      TrueSheetActions.pop(2),
      {}
    );

    expect(result?.affectedRouteKey).toBe('Details-test');
    expect(result?.state.routes[1]?.closing).toBe(true);
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
