import { createRef } from 'react';
import { act, render } from '@testing-library/react-native';
import { TrueSheet } from '../TrueSheet.web';
import type { TrueSheetMethods } from '../TrueSheet.types';
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

jest.mock('../TrueSheetProvider.web', () => ({
  usePortalContainer: () => null,
  useRegisterSheet: () => {},
  useSheetStack: () => ({ descendants: [], isNested: false, dismissAbove: jest.fn() }),
}));

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
    await act(() => sheet.ref.current!.dismiss());
    act(() => jest.runOnlyPendingTimers());
    sheet.rerender(<TrueSheet {...props} initialDetentIndex={-1} />);
    sheet.rerender(<TrueSheet {...props} initialDetentIndex={0} />);
    expect(drawer().open).toBe(false);
    expect(onDidPresent).toHaveBeenCalledTimes(1);
  });

  it('preserves an already presented sheet when the initial index arrives', async () => {
    const sheet = setup(-1);
    await act(() => sheet.ref.current!.present(1));
    act(() => jest.runOnlyPendingTimers());
    sheet.rerender(<TrueSheet {...sheet.props} initialDetentIndex={2} />);
    expect(sheet.UNSAFE_getByType(Drawer.Root).props.activeSnapPoint).toBe(0.4);
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
    await act(() => sheet.ref.current!.dismiss());
    act(() => jest.runOnlyPendingTimers());
    sheet.rerender(<TrueSheet {...sheet.props} />);
    await act(() => sheet.ref.current!.present(1));
    expect(sheet.color()).toBe('#123456');
  });
});
