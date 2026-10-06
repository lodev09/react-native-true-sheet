import { createRef } from 'react';
import { act, render } from '@testing-library/react-native';
import { TrueSheet } from '../TrueSheet.web';
import { TrueSheetProvider, useTrueSheet } from '../TrueSheetProvider.web';
import type { TrueSheetMethods, TrueSheetStaticMethods } from '../TrueSheet.types';
import { Drawer } from '../web/vaul';

jest.mock('../web/vaul', () => {
  const React = require('react');
  const Content = React.forwardRef((props: object, ref: unknown) =>
    React.createElement('div', { ...props, ref })
  );
  const Root = ({ children, ...props }: { children: React.ReactNode }) =>
    React.createElement('div', props, children);
  return { Drawer: { Root, Content, Portal: Root, Overlay: Root, Title: Root, Handle: Root } };
});

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
