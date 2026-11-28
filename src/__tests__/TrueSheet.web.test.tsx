import { createRef, useEffect } from 'react';
import { act, render } from '@testing-library/react-native';
import { TrueSheet } from '../TrueSheet.web';
import { TrueSheetProvider, useTrueSheet } from '../TrueSheetProvider.web';
import type { SheetDetent, TrueSheetMethods, TrueSheetStaticMethods } from '../TrueSheet.types';
import { Drawer } from '../web/vaul';
import { useIsHydrated } from '../web/hydration';

jest.mock('../web/vaul', () => {
  const React = require('react');
  const Content = React.forwardRef((props: object, ref: unknown) =>
    React.createElement('div', { ...props, ref })
  );
  const Root = ({ children, ...props }: { children: React.ReactNode }) =>
    React.createElement('div', props, children);
  const Portal = ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children);
  return { Drawer: { Root, Content, Portal, Overlay: Root, Title: Root, Handle: Root } };
});

jest.mock('../web/hydration', () => ({ useIsHydrated: jest.fn(() => true) }));

jest.mock('../web/layout', () => ({
  observeSheetLayout: () => ({ disconnect: jest.fn() }),
}));

class MockElement {
  isConnected = true;
  offsetHeight = 1000;
  closest() {
    return null;
  }
  getAnimations() {
    return [];
  }
  appendChild() {}
}

const backgrounds = [null, '#123456', { color: '#abcdef' }];

beforeEach(() => {
  jest.useFakeTimers();
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });
  global.HTMLElement = MockElement as unknown as typeof HTMLElement;
});

afterEach(() => {
  jest.useRealTimers();
});

// present()/dismiss() settle on didPresent/didDismiss, which wait on (fake) timers
const fire = (call: () => Promise<void>) =>
  act(() => {
    call();
  });

function setup(initialDetentIndex = 0) {
  const ref = createRef<TrueSheetMethods>();
  const props = {
    ref,
    initialDetentIndex,
    detents: [0.1, 0.4, 1],
    backgroundColor: '#eeeeee',
    detentBackgrounds: backgrounds,
  };
  const result = render(<TrueSheet {...props} />, { createNodeMock: () => new MockElement() });
  const color = () =>
    result.UNSAFE_root.findByProps({ 'aria-hidden': true }).props.style.backgroundColor;
  const move = (position: number) =>
    act(() => {
      result.UNSAFE_getByType(Drawer.Root).props.onPositionChange(position);
    });
  return { ...result, props, ref, color, move };
}

describe('web initial presentation', () => {
  it('applies initialDetentAnimated only to auto-presentation', () => {
    const sheet = setup(-1);
    sheet.rerender(<TrueSheet {...sheet.props} initialDetentAnimated={false} />);
    expect(sheet.UNSAFE_getByType(Drawer.Root).props.initialAnimated).toBe(true);
    sheet.rerender(
      <TrueSheet {...sheet.props} initialDetentIndex={0} initialDetentAnimated={false} />
    );
    expect(sheet.UNSAFE_getByType(Drawer.Root).props.initialAnimated).toBe(false);
  });

  it('presents at a deferred index only once, including after dismissal', async () => {
    const sheet = setup(-1);
    const onWillPresent = jest.fn();
    const onDidPresent = jest.fn();
    const props = { ...sheet.props, onWillPresent, onDidPresent };
    const drawer = () => sheet.UNSAFE_getByType(Drawer.Root).props;

    expect(drawer().open).toBe(false);
    sheet.rerender(<TrueSheet {...props} initialDetentIndex={2} />);
    expect(drawer().open).toBe(true);
    expect(drawer().activeSnapPoint).toBe(1);
    expect(sheet.color()).toBe('#abcdef');
    act(() => jest.runOnlyPendingTimers());
    expect(onWillPresent).toHaveBeenCalledTimes(1);
    expect(onDidPresent).toHaveBeenCalledTimes(1);
    expect(onDidPresent.mock.calls[0]![0].nativeEvent.index).toBe(2);

    sheet.rerender(<TrueSheet {...props} initialDetentIndex={1} />);
    expect(drawer().activeSnapPoint).toBe(1);
    fire(() => sheet.ref.current!.dismiss());
    act(() => jest.runOnlyPendingTimers());
    sheet.rerender(<TrueSheet {...props} initialDetentIndex={-1} />);
    sheet.rerender(<TrueSheet {...props} initialDetentIndex={0} />);
    expect(drawer().open).toBe(false);
    expect(onDidPresent).toHaveBeenCalledTimes(1);
  });

  it('preserves an already presented sheet when the initial index arrives', () => {
    const sheet = setup(-1);
    fire(() => sheet.ref.current!.present(1));
    act(() => jest.runOnlyPendingTimers());
    sheet.rerender(<TrueSheet {...sheet.props} initialDetentIndex={2} />);
    expect(sheet.UNSAFE_getByType(Drawer.Root).props.activeSnapPoint).toBe(0.4);
  });
});

describe('web present and dismiss', () => {
  function setupEvents() {
    const sheet = setup(-1);
    const events: string[] = [];
    const log = (event: string) => () => {
      events.push(event);
    };
    sheet.rerender(
      <TrueSheet
        {...sheet.props}
        onWillPresent={log('willPresent')}
        onDidPresent={log('didPresent')}
        onWillDismiss={log('willDismiss')}
        onDidDismiss={log('didDismiss')}
      />
    );
    const present = () => fire(() => sheet.ref.current!.present().then(log('presented')));
    const dismiss = () => fire(() => sheet.ref.current!.dismiss().then(log('dismissed')));
    const flush = () =>
      act(async () => {
        jest.runOnlyPendingTimers();
      });
    return { ...sheet, events, present, dismiss, flush };
  }

  it('resolves present on didPresent and dismiss on didDismiss', async () => {
    const sheet = setupEvents();
    sheet.present();
    expect(sheet.events).toEqual([]);
    await sheet.flush();
    sheet.dismiss();
    await sheet.flush();
    expect(sheet.events).toEqual([
      'willPresent',
      'didPresent',
      'presented',
      'willDismiss',
      'didDismiss',
      'dismissed',
    ]);
  });

  it('cancels without events when dismissed before willPresent', async () => {
    const sheet = setupEvents();
    sheet.present();
    sheet.dismiss();
    await sheet.flush();
    expect(sheet.events).toEqual(['presented', 'dismissed']);
  });

  it('cancels an auto-present when dismissed before willPresent', async () => {
    const sheet = setup(0);
    const events: string[] = [];
    const log = (event: string) => () => {
      events.push(event);
    };
    sheet.rerender(
      <TrueSheet
        {...sheet.props}
        onWillPresent={log('willPresent')}
        onDidPresent={log('didPresent')}
        onWillDismiss={log('willDismiss')}
        onDidDismiss={log('didDismiss')}
      />
    );
    fire(() => sheet.ref.current!.dismiss().then(log('dismissed')));
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(events).toEqual(['dismissed']);
    expect(sheet.UNSAFE_getByType(Drawer.Root).props.open).toBe(false);
  });

  it('presents again after a canceled auto-present when the close and reopen batch', async () => {
    const sheet = setup(0);
    const events: string[] = [];
    const log = (event: string) => () => {
      events.push(event);
    };
    sheet.rerender(
      <TrueSheet
        {...sheet.props}
        onWillPresent={log('willPresent')}
        onDidPresent={log('didPresent')}
        onWillDismiss={log('willDismiss')}
        onDidDismiss={log('didDismiss')}
      />
    );
    await act(async () => {
      sheet.ref.current!.dismiss().then(log('dismissed'));
      // The pending frame runs before React commits the close
      jest.runOnlyPendingTimers();
      sheet.ref.current!.present(1).then(log('presented'));
    });
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(events).toEqual(['dismissed', 'willPresent', 'didPresent', 'presented']);
    expect(sheet.UNSAFE_getByType(Drawer.Root).props.open).toBe(true);
  });

  it('emits willPresent with the reopened detent when the close and reopen batch', async () => {
    const sheet = setup(0);
    const onWillPresent = jest.fn();
    const onDidPresent = jest.fn();
    sheet.rerender(
      <TrueSheet {...sheet.props} onWillPresent={onWillPresent} onDidPresent={onDidPresent} />
    );
    await act(async () => {
      sheet.ref.current!.dismiss();
      sheet.ref.current!.present(1);
      // The pending frame runs before React commits the reopen
      jest.runOnlyPendingTimers();
    });
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(onWillPresent).toHaveBeenCalledTimes(1);
    expect(onWillPresent.mock.calls[0]![0].nativeEvent.index).toBe(1);
    expect(onDidPresent.mock.calls[0]![0].nativeEvent.index).toBe(1);
  });

  it('treats a batched reopen at another detent as a present, not a resize', async () => {
    const sheet = setup(0);
    const events: string[] = [];
    const log = (event: string) => (e: { nativeEvent: { index: number } }) => {
      events.push(`${event}:${e.nativeEvent.index}`);
    };
    sheet.rerender(
      <TrueSheet
        {...sheet.props}
        onWillPresent={log('willPresent')}
        onDidPresent={log('didPresent')}
        onDetentChange={log('detentChange')}
      />
    );
    await act(async () => {
      sheet.ref.current!.dismiss();
      sheet.ref.current!.present(1);
    });
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    await act(() => sheet.ref.current!.resize(2));
    expect(events).toEqual(['willPresent:1', 'didPresent:1', 'detentChange:2']);
  });

  it('ignores present while presented or dismissing, and dismiss while dismissed', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const sheet = setupEvents();
    sheet.present();
    await sheet.flush();
    sheet.present();
    sheet.dismiss();
    sheet.present();
    sheet.dismiss();
    await sheet.flush();
    const resolved = ['presented', 'dismissed'];
    expect(sheet.events.filter((e) => !resolved.includes(e))).toEqual([
      'willPresent',
      'didPresent',
      'willDismiss',
      'didDismiss',
    ]);
    expect(sheet.events.filter((e) => resolved.includes(e)).sort()).toEqual([
      'dismissed',
      'dismissed',
      'presented',
      'presented',
      'presented',
    ]);
    expect(sheet.UNSAFE_getByType(Drawer.Root).props.open).toBe(false);
    expect(warn.mock.calls.map(([message]) => message)).toEqual([
      expect.stringContaining('already presented'),
      expect.stringContaining('already presented'),
      expect.stringContaining('already dismissed'),
    ]);
    warn.mockRestore();
  });

  it('dismissAll cancels a present that has not committed yet', async () => {
    const ref = createRef<TrueSheetMethods>();
    let methods: TrueSheetStaticMethods;
    const Methods = () => {
      methods = useTrueSheet();
      return null;
    };
    const result = render(
      <TrueSheetProvider>
        <TrueSheet ref={ref} />
        <Methods />
      </TrueSheetProvider>,
      { createNodeMock: () => new MockElement() }
    );
    await act(async () => {
      ref.current!.present();
      await methods.dismissAll();
    });
    expect(result.UNSAFE_getByType(Drawer.Root).props.open).toBe(false);
  });
});

describe('web detents change', () => {
  it('keeps the active detent, falls back to its index, and reports changes', async () => {
    const ref = createRef<TrueSheetMethods>();
    const onDetentChange = jest.fn();
    const colors: Record<string, string> = { peek: '#111111', 0.45: '#454545', 1: '#ffffff' };
    const sheet = (detents: SheetDetent[]) => (
      <TrueSheet
        ref={ref}
        initialDetentIndex={0}
        detents={detents}
        detentBackgrounds={detents.map((detent) => colors[detent] ?? null)}
        onDetentChange={onDetentChange}
      />
    );
    const result = render(sheet([0.45, 1]), { createNodeMock: () => new MockElement() });
    const update = (detents: SheetDetent[]) => result.rerender(sheet(detents));
    const snap = () => result.UNSAFE_getByType(Drawer.Root).props.activeSnapPoint;
    const color = () =>
      result.UNSAFE_root.findByProps({ 'aria-hidden': true }).props.style.backgroundColor;
    act(() => jest.runOnlyPendingTimers());

    update(['peek', 0.45, 1]);
    expect(snap()).toBe(0.45);
    expect(color()).toBe('#454545');
    update([0.45, 1]);
    expect(snap()).toBe(0.45);
    expect(color()).toBe('#454545');
    await act(() => ref.current!.resize(1));
    update(['peek', 0.45, 1]);
    expect(snap()).toBe(1);
    update(['peek', 0.45]);
    expect(snap()).toBe(0.45);
    update(['peek', 0.5]);
    expect(snap()).toBe(0.5);
    expect(onDetentChange.mock.calls.map(([e]) => e.nativeEvent.index)).toEqual([1, 0, 1, 2, 1, 1]);
  });
});

describe('web dim', () => {
  const dimColor = (props: { dimColor?: string; dimOpacity?: number }) =>
    render(<TrueSheet initialDetentIndex={0} {...props} />, {
      createNodeMock: () => new MockElement(),
    }).UNSAFE_root.findAll((node: any) => node.props.style?.inset === 0)[0]!.props.style
      .backgroundColor;

  it('keeps the default dim unless a color or opacity is set', () => {
    expect(dimColor({})).toBe('rgba(0, 0, 0, 0.5)');
  });

  it('mixes the color and the clamped opacity into the overlay color', () => {
    expect(dimColor({ dimColor: '#1b0a3c', dimOpacity: 0.3 })).toBe(
      'color-mix(in srgb, #1b0a3c 30%, transparent)'
    );
    expect(dimColor({ dimColor: 'red' })).toBe('color-mix(in srgb, red 50%, transparent)');
    expect(dimColor({ dimOpacity: 2 })).toBe('color-mix(in srgb, black 100%, transparent)');
  });
});

describe('web detent backgrounds', () => {
  it('starts at the presented entry and holds it during presentation', () => {
    const sheet = setup(2);
    expect(sheet.color()).toBe('#abcdef');
    sheet.move(900);
    expect(sheet.color()).toBe('#abcdef');
    act(() => jest.runOnlyPendingTimers());
    sheet.move(301);
    expect(sheet.color()).toBe('#123456');
  });

  it('cross-fades past midpoints in both directions, including resize', async () => {
    const sheet = setup();
    act(() => jest.runOnlyPendingTimers());
    expect(sheet.color()).toBe('#eeeeee');
    sheet.move(750);
    expect(sheet.color()).toBe('#eeeeee');
    sheet.move(749);
    expect(sheet.color()).toBe('#123456');
    sheet.move(750);
    expect(sheet.color()).toBe('#123456');
    sheet.move(751);
    expect(sheet.color()).toBe('#eeeeee');
    await act(() => sheet.ref.current!.resize(2));
    expect(sheet.color()).toBe('#eeeeee');
    sheet.move(299);
    expect(sheet.color()).toBe('#abcdef');
  });

  it('applies updates, blur fallback, removal, and the entry on reopen', async () => {
    const sheet = setup(2);
    act(() => jest.runOnlyPendingTimers());
    sheet.rerender(
      <TrueSheet {...sheet.props} detentBackgrounds={[null, null, { blur: 'dark' }]} />
    );
    expect(sheet.color()).toBe('#eeeeee');
    sheet.rerender(
      <TrueSheet {...sheet.props} detentBackgrounds={[null, null, { color: 'transparent' }]} />
    );
    expect(sheet.color()).toBe('transparent');
    sheet.rerender(<TrueSheet {...sheet.props} detentBackgrounds={[null, null, 'transparent']} />);
    expect(sheet.color()).toBe('transparent');
    sheet.rerender(<TrueSheet {...sheet.props} detentBackgrounds={undefined} />);
    expect(sheet.color()).toBe('#eeeeee');
    fire(() => sheet.ref.current!.dismiss());
    act(() => jest.runOnlyPendingTimers());
    sheet.rerender(<TrueSheet {...sheet.props} />);
    fire(() => sheet.ref.current!.present(1));
    expect(sheet.color()).toBe('#123456');
  });
});

describe('web server rendering', () => {
  const isHydrated = useIsHydrated as jest.Mock;
  const wrapperSizing = (sheet: ReturnType<typeof setup>) =>
    sheet.UNSAFE_getByType(Drawer.Root).props.detachedWrapperStyle;
  const sizingStyle = (sheet: ReturnType<typeof setup>) =>
    sheet.UNSAFE_queryByProps({ href: 'true-sheet-server-rendering' });

  afterEach(() => {
    isHydrated.mockReturnValue(true);
  });

  it('renders a sheet presented from the start in place until hydrated, without animating it in', () => {
    isHydrated.mockReturnValue(false);
    const sheet = setup(0);

    expect(sheet.UNSAFE_queryByType(Drawer.Portal)).toBeNull();
    expect(sheet.UNSAFE_getByType(Drawer.Root).props.initialAnimated).toBe(false);
    expect(sizingStyle(sheet)).not.toBeNull();
    expect(wrapperSizing(sheet)).toMatchObject({
      '--true-sheet-wide-max-width': '640px',
      '--true-sheet-wide-margin-inline-start': 'auto',
      '--true-sheet-wide-margin-inline-end': 'auto',
    });

    // Still mounted where it is once hydrated (its layer moves, see the next test), not animated in
    isHydrated.mockReturnValue(true);
    sheet.rerender(<TrueSheet {...sheet.props} />);
    expect(sheet.UNSAFE_queryByType(Drawer.Portal)).toBeNull();
    expect(sheet.UNSAFE_getByType(Drawer.Root).props.initialAnimated).toBe(false);
    expect(sizingStyle(sheet)).toBeNull();
    // Sized from the window once hydrated (750 wide in tests)
    expect(wrapperSizing(sheet)).toMatchObject({ maxWidth: 640, marginInlineStart: 'auto' });
    expect(Object.keys(wrapperSizing(sheet)).filter((key) => key.startsWith('--'))).toEqual([]);
  });

  it('moves a sheet rendered in place to the portal container once hydrated, still mounted', () => {
    const mounts = jest.fn();
    const Child = () => {
      useEffect(() => mounts(), []);
      return null;
    };
    const container = Object.assign(new MockElement(), {
      children: [],
      insertBefore: jest.fn(),
      setAttribute: jest.fn(),
    });
    global.document = {
      createElement: () => container,
      activeElement: null,
    } as unknown as Document;
    // The placeholder in place and the layer in it (display: contents), the layer created first
    const layers: MockElement[] = [];
    const createNodeMock = ({ props }: { props: unknown }) => {
      const node = Object.assign(new MockElement(), { appendChild: jest.fn() });
      if ((props as { style?: { display?: string } }).style?.display === 'contents') {
        layers.push(node);
      }
      return node;
    };
    const tree = () => (
      <TrueSheetProvider>
        <TrueSheet initialDetentIndex={0} detents={[0.5]}>
          <Child />
        </TrueSheet>
      </TrueSheetProvider>
    );
    isHydrated.mockReturnValue(false);
    const result = render(tree(), { createNodeMock });
    expect(container.insertBefore).not.toHaveBeenCalled();

    isHydrated.mockReturnValue(true);
    result.rerender(tree());
    const [layer, placeholder] = layers;
    expect(container.insertBefore).toHaveBeenCalledWith(layer, null);
    expect(mounts).toHaveBeenCalledTimes(1);

    // Back in its placeholder before React removes it
    result.unmount();
    expect(placeholder!.appendChild).toHaveBeenCalledWith(layer);
    // @ts-expect-error restored for the other tests
    delete global.document;
  });

  it('portals a server-rendered sheet once dismissed, for its next presentations', () => {
    isHydrated.mockReturnValue(false);
    const sheet = setup(0);
    isHydrated.mockReturnValue(true);
    sheet.rerender(<TrueSheet {...sheet.props} />);
    act(() => jest.runOnlyPendingTimers());
    expect(sheet.UNSAFE_queryByType(Drawer.Portal)).toBeNull();

    fire(() => sheet.ref.current!.dismiss());
    act(() => jest.runOnlyPendingTimers());
    expect(sheet.UNSAFE_queryByType(Drawer.Portal)).not.toBeNull();
  });

  it('portals a server-rendered sheet dismissed before it presents', () => {
    isHydrated.mockReturnValue(false);
    const sheet = setup(0);
    isHydrated.mockReturnValue(true);
    sheet.rerender(<TrueSheet {...sheet.props} />);

    fire(() => sheet.ref.current!.dismiss());
    expect(sheet.UNSAFE_queryByType(Drawer.Portal)).not.toBeNull();
  });

  it('renders the default colors of the system color scheme until hydrated', () => {
    isHydrated.mockReturnValue(false);
    const sheet = setup(0);
    const props = { ...sheet.props, backgroundColor: undefined };
    sheet.rerender(<TrueSheet {...props} />);

    // Drawer.Handle is the same mock as Drawer.Root: the one styled as the grabber
    const grabber = sheet
      .UNSAFE_getAllByType(Drawer.Handle)
      .find((node) => node.props.style?.transform === 'translateX(-50%)');
    expect(grabber?.props.style.backgroundColor).toBe('var(--true-sheet-default-grabber-color)');
    expect(sheet.color()).toBe('var(--true-sheet-default-background)');

    isHydrated.mockReturnValue(true);
    sheet.rerender(<TrueSheet {...props} />);
    expect(sheet.color()).not.toContain('var(');
  });

  it('renders a form sheet presented from the start once hydrated, in the portal, animated in', () => {
    isHydrated.mockReturnValue(false);
    const props = { initialDetentIndex: 0, detents: [0.5], presentation: 'form' as const };
    const result = render(<TrueSheet {...props} />, { createNodeMock: () => new MockElement() });
    // Nothing until hydrated, as on the server: a portal can't be hydrated
    expect(result.UNSAFE_queryByType(Drawer.Portal)).toBeNull();
    expect(result.UNSAFE_queryByType(Drawer.Content)).toBeNull();

    isHydrated.mockReturnValue(true);
    result.rerender(<TrueSheet {...props} />);
    expect(result.UNSAFE_queryByType(Drawer.Portal)).not.toBeNull();
    expect(result.UNSAFE_getByType(Drawer.Root).props.initialAnimated).toBe(true);
  });

  it('tints a dim blur for the system color scheme until hydrated', () => {
    isHydrated.mockReturnValue(false);
    const sheet = setup(0);
    const props = { ...sheet.props, dimBlur: 'regular' as const };
    sheet.rerender(<TrueSheet {...props} />);
    // Drawer.Overlay is the same mock as Drawer.Root: the one styled as the dim
    const dimStyle = () =>
      sheet.UNSAFE_getAllByType(Drawer.Overlay).find((node) => node.props.style?.backdropFilter)
        ?.props.style;

    expect(dimStyle()).toMatchObject({
      colorScheme: 'light dark',
      backgroundColor: expect.stringMatching(/^light-dark\(rgba\(252, .+\), rgba\(27, .+\)\)$/),
    });

    isHydrated.mockReturnValue(true);
    sheet.rerender(<TrueSheet {...props} />);
    expect(dimStyle()?.colorScheme).toBeUndefined();
    expect(dimStyle()?.backgroundColor).toMatch(/^rgba\(252, /);
  });

  it('portals a sheet presented later once hydrated', () => {
    isHydrated.mockReturnValue(false);
    const sheet = setup(-1);
    expect(sheet.UNSAFE_queryByType(Drawer.Portal)).toBeNull();

    isHydrated.mockReturnValue(true);
    sheet.rerender(<TrueSheet {...sheet.props} />);
    expect(sheet.UNSAFE_queryByType(Drawer.Portal)).not.toBeNull();
  });

  it('portals and animates a sheet presented from the start in a client-rendered app', () => {
    const sheet = setup(0);
    expect(sheet.UNSAFE_queryByType(Drawer.Portal)).not.toBeNull();
    expect(sheet.UNSAFE_getByType(Drawer.Root).props.initialAnimated).toBe(true);
    expect(sizingStyle(sheet)).toBeNull();
  });
});
