import { act, render, renderHook } from '@testing-library/react-native';
import { Drawer } from '../web/vaul';
import { useSnapPoints } from '../web/vaul/use-snap-points';

jest.mock('../web/vaul/style.css', () => ({}));
jest.mock('../web/vaul/use-prevent-scroll', () => ({ usePreventScroll: () => {} }));
jest.mock('../web/vaul/use-position-fixed', () => ({
  usePositionFixed: () => ({ restorePositionSetting: () => {} }),
}));
jest.mock('../web/vaul/use-scale-background', () => ({ useScaleBackground: () => {} }));
jest.mock('@radix-ui/react-dialog', () => {
  const React = require('react');
  const Content = React.forwardRef((props: object, ref: unknown) =>
    React.createElement('div', { ...props, ref })
  );
  return { Content, Root: ({ children }: { children: React.ReactNode }) => children };
});
jest.mock('@radix-ui/react-presence', () => ({
  Presence: ({ children }: { children: React.ReactNode }) => children,
}));

class MockElement {
  transitions: string[] = [];
  style: Record<string, unknown> = {
    setProperty: (key: string, value: string) => {
      this.style[key] = value;
    },
  };
  constructor() {
    Object.defineProperty(this.style, 'transition', {
      get: () => this.transitions[this.transitions.length - 1],
      set: (value: string) => this.transitions.push(value),
    });
  }
  get offsetHeight() {
    return 400;
  }
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  getBoundingClientRect = () => ({ height: 400, top: 600 });
  closest = (): MockElement | null => null;
}

beforeEach(() => {
  jest.useFakeTimers();
  Object.assign(window, {
    innerHeight: 1000,
    innerWidth: 500,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });
  global.HTMLElement = MockElement as unknown as typeof HTMLElement;
  global.document = { documentElement: new MockElement() } as unknown as Document;
  global.ResizeObserver = class {
    observe() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(() => {
  jest.useRealTimers();
});

describe('initial drawer animation', () => {
  it.each([
    { mode: 'immediate', animated: false },
    { mode: 'deferred', animated: false },
    { mode: 'portal', animated: false },
    { mode: 'immediate', animated: true },
    { mode: 'deferred', animated: true },
    { mode: 'portal', animated: true },
  ])('respects animated=$animated on $mode presentation', ({ mode, animated }) => {
    const wrapper = new MockElement();
    const drawer = new MockElement();
    const overlay = new MockElement();
    drawer.closest = () => wrapper;
    const layout = jest.spyOn(wrapper, 'offsetHeight', 'get');
    const snapPoints = [0.4, 1];
    const sheet = (open: boolean, mounted = true, activeSnapPoint = 0.4) => (
      <Drawer.Root
        open={open}
        initialAnimated={animated}
        snapPoints={snapPoints}
        activeSnapPoint={activeSnapPoint}
        fadeFromIndex={0}
        contentHeight={400}
      >
        {mounted && <Drawer.Overlay />}
        {mounted && <Drawer.Content />}
      </Drawer.Root>
    );
    const result = render(sheet(mode !== 'deferred', mode === 'immediate'), {
      createNodeMock: ({ props }) => {
        const attributes = props as Record<string, unknown>;
        if ('data-vaul-drawer' in attributes) return drawer;
        if ('data-vaul-overlay' in attributes) return overlay;
        return new MockElement();
      },
    });
    act(() => jest.runOnlyPendingTimers());
    if (mode !== 'immediate') result.rerender(sheet(true));

    expect(layout).toHaveBeenCalledTimes(animated ? 1 : 0);
    expect(wrapper.style.transform).toBe('translate3d(0, 0px, 0)');
    expect(drawer.style['--snap-point-height']).toBe('600px');
    expect(overlay.style.opacity).toBe('1');
    if (animated) {
      expect(drawer.transitions[0]).toContain('--snap-point-height 0.5s');
      expect(overlay.transitions[0]).toContain('opacity 0.5s');
    } else {
      expect(drawer.transitions[0]).toBe('none');
      expect(overlay.transitions[0]).toBe('none');
    }

    act(() => jest.runOnlyPendingTimers());
    result.rerender(sheet(true, true, 1));
    expect(drawer.style.transition).toContain('--snap-point-height 0.5s');
    result.rerender(sheet(false));
    expect(wrapper.style.transition).toContain('transform 0.5s');
    expect(wrapper.style.transform).toBe('translate3d(0, 1000px, 0)');
    result.rerender(sheet(false, false));
    result.rerender(sheet(true));
    expect(layout).toHaveBeenCalledTimes(animated ? 2 : 1);
  });

  it('settles initial measurements without animation before the first frame', () => {
    const drawer = new MockElement();
    const props = {
      drawerRef: { current: drawer as unknown as HTMLDivElement },
      overlayRef: { current: null },
      snapPoints: ['peek', 1],
      activeSnapPointProp: 'peek',
      onSnapPointChange: jest.fn(),
      isOpen: true,
      initialAnimated: false,
      peekHeight: 150,
    };
    const { rerender } = renderHook((options: typeof props) => useSnapPoints(options), {
      initialProps: props,
    });
    rerender({ ...props, peekHeight: 96 });
    expect(drawer.style['--snap-point-height']).toBe('904px');
    expect(drawer.transitions).toEqual(['none', 'none']);
    expect(props.onSnapPointChange).toHaveBeenLastCalledWith(0, false);

    act(() => jest.runOnlyPendingTimers());
    rerender({ ...props, peekHeight: 128 });
    expect(drawer.style.transition).toContain('--snap-point-height 0.5s');
    expect(props.onSnapPointChange).toHaveBeenLastCalledWith(0, true);
  });
});
