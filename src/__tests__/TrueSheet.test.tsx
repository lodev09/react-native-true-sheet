/* eslint-disable dot-notation -- bracket access reaches TrueSheet's private test hooks with full typing */
import { createRef } from 'react';
import { processColor, StyleSheet, Text, View } from 'react-native';
import { render, act } from '@testing-library/react-native';
import { TrueSheet, TrueSheetOverlay, TrueSheetPeek } from '../index';
import TrueSheetModule from '../specs/NativeTrueSheetModule';
import { TrueSheetBackground } from '../TrueSheetBackground';
import TrueSheetContainerViewNativeComponent from '../fabric/TrueSheetContainerViewNativeComponent';
import type {
  DidDismissEvent,
  DismissAttemptEvent,
  WillFocusEvent,
  DidFocusEvent,
  WillBlurEvent,
  DidBlurEvent,
} from '../TrueSheet.types';

describe('TrueSheet', () => {
  it('normalizes detent backgrounds and updates or removes them', () => {
    const backgrounds = [null, { color: 'transparent' }, { blur: 'dark' }] as const;
    const { getByTestId, rerender } = render(
      <TrueSheet testID="detent-backgrounds" detentBackgrounds={[...backgrounds]} />
    );
    expect(getByTestId('detent-backgrounds').props.detentBackgrounds).toEqual([
      {},
      { color: processColor('transparent') },
      { blur: 'dark', color: undefined },
    ]);

    rerender(<TrueSheet testID="detent-backgrounds" detentBackgrounds={[{ color: '#123456' }]} />);
    expect(getByTestId('detent-backgrounds').props.detentBackgrounds).toEqual([
      { color: processColor('#123456') },
    ]);
    rerender(<TrueSheet testID="detent-backgrounds" />);
    expect(getByTestId('detent-backgrounds').props.detentBackgrounds).toBeUndefined();
  });

  it.each(['#123456', 'red', 'rgba(0, 0, 0, 0.5)', 'transparent'])(
    'treats the string %s as a detent color',
    (color) => {
      const { getByTestId } = render(
        <TrueSheet
          testID="detent-backgrounds"
          detentBackgrounds={[color, { color }, { blur: 'dark' }]}
        />
      );
      expect(getByTestId('detent-backgrounds').props.detentBackgrounds).toEqual([
        { color: processColor(color) },
        { color: processColor(color) },
        { blur: 'dark', color: undefined },
      ]);
    }
  );

  it('normalizes sparse detent backgrounds and trims entries with the detents', () => {
    const backgrounds = new Array(4);
    backgrounds[1] = { color: '#123456' };
    const { getByTestId } = render(
      <TrueSheet testID="detent-backgrounds" detentBackgrounds={backgrounds} />
    );
    expect(getByTestId('detent-backgrounds').props.detentBackgrounds).toEqual([
      {},
      { color: processColor('#123456') },
      {},
    ]);
  });

  it('should export TrueSheet component', () => {
    expect(TrueSheet).toBeDefined();
    expect(typeof TrueSheet).toBe('function');
  });

  it('should have present static method', () => {
    expect(TrueSheet.present).toBeDefined();
    expect(typeof TrueSheet.present).toBe('function');
  });

  it('should have dismiss static method', () => {
    expect(TrueSheet.dismiss).toBeDefined();
    expect(typeof TrueSheet.dismiss).toBe('function');
  });

  it('should have resize static method', () => {
    expect(TrueSheet.resize).toBeDefined();
    expect(typeof TrueSheet.resize).toBe('function');
  });

  it('should have dismissAll static method', () => {
    expect(TrueSheet.dismissAll).toBeDefined();
    expect(typeof TrueSheet.dismissAll).toBe('function');
  });

  it('should render TrueSheet component without crashing', () => {
    const { getByText } = render(
      <TrueSheet name="test" initialDetentIndex={0}>
        <Text>Test Content</Text>
      </TrueSheet>
    );
    expect(getByText('Test Content')).toBeDefined();
  });

  it('should render with footer prop', () => {
    const { getByText } = render(
      <TrueSheet name="test" initialDetentIndex={0} footer={<Text>Footer Content</Text>}>
        <Text>Content</Text>
      </TrueSheet>
    );
    expect(getByText('Content')).toBeDefined();
    expect(getByText('Footer Content')).toBeDefined();
  });

  it('should render TrueSheetPeek within content', () => {
    const { getByText } = render(
      <TrueSheet name="test" detents={['peek', 1]} initialDetentIndex={0}>
        <TrueSheetPeek>
          <Text>Peek Content</Text>
        </TrueSheetPeek>
        <Text>Content</Text>
      </TrueSheet>
    );
    expect(getByText('Peek Content')).toBeDefined();
    expect(getByText('Content')).toBeDefined();
  });

  describe('Background', () => {
    it('renders a non-interactive background before the header, content, and footer', () => {
      const { getByTestId, UNSAFE_getByType } = render(
        <TrueSheet
          initialDetentIndex={0}
          testID="background-host"
          background={<View testID="custom-background" style={StyleSheet.absoluteFill} />}
          header={<Text>Header</Text>}
          footer={<Text>Footer</Text>}
        >
          <Text>Content</Text>
        </TrueSheet>
      );

      const wrapper = UNSAFE_getByType(TrueSheetBackground).findByType(View);
      const container = UNSAFE_getByType(TrueSheetContainerViewNativeComponent);
      const layers = container.findAll(
        (node: { type: unknown }) => node.type === TrueSheetBackground || node.type === Text
      );
      expect(layers).toHaveLength(4);
      expect(layers[0].type === TrueSheetBackground).toBe(true);
      expect(wrapper.props.pointerEvents).toBe('none');
      expect(StyleSheet.flatten(wrapper.props.style)).toEqual(StyleSheet.absoluteFill);
      expect(wrapper.findByProps({ testID: 'custom-background' })).toBeDefined();
      expect(getByTestId('background-host').props.background).toBeUndefined();
    });

    it('applies only the flattened background color and updates without a custom node', () => {
      const backgroundStyle = StyleSheet.create({
        tint: { backgroundColor: 'red', top: 40, opacity: 0.5, pointerEvents: 'auto' },
      });
      const { rerender, UNSAFE_getByType, getByTestId } = render(
        <TrueSheet
          initialDetentIndex={0}
          testID="styled-background-host"
          backgroundStyle={[backgroundStyle.tint, false, [{ backgroundColor: 'blue' }]]}
        />
      );

      const wrapper = () => UNSAFE_getByType(TrueSheetBackground).findByType(View);
      expect(StyleSheet.flatten(wrapper().props.style)).toEqual({
        ...StyleSheet.absoluteFill,
        backgroundColor: 'blue',
      });
      expect(wrapper().props.pointerEvents).toBe('none');
      expect(getByTestId('styled-background-host').props.backgroundStyle).toBeUndefined();

      rerender(<TrueSheet initialDetentIndex={0} backgroundStyle={{ backgroundColor: 'green' }} />);
      expect(StyleSheet.flatten(wrapper().props.style).backgroundColor).toBe('green');

      rerender(<TrueSheet initialDetentIndex={0} />);
      expect(StyleSheet.flatten(wrapper().props.style).backgroundColor).toBeUndefined();
    });

    it('mounts the background with lazy sheet content', () => {
      const background = <View testID="lazy-background" />;
      const { queryByTestId, rerender } = render(<TrueSheet background={background} />);
      expect(queryByTestId('lazy-background')).toBeNull();

      rerender(<TrueSheet background={background} lazy={false} />);
      expect(queryByTestId('lazy-background')).not.toBeNull();
    });

    it('keeps the wrapper tint separate from sheet color and blur updates', () => {
      const backgroundStyle = { backgroundColor: 'rgba(0, 122, 255, 0.25)' };
      const { getByTestId, UNSAFE_getByType, rerender } = render(
        <TrueSheet
          initialDetentIndex={0}
          testID="effect-background-host"
          backgroundColor="transparent"
          backgroundStyle={backgroundStyle}
        />
      );

      expect(getByTestId('effect-background-host').props.backgroundColor).toBe('transparent');

      rerender(
        <TrueSheet
          initialDetentIndex={0}
          testID="effect-background-host"
          backgroundBlur="system-material"
          backgroundStyle={backgroundStyle}
        />
      );

      const host = getByTestId('effect-background-host');
      const wrapper = UNSAFE_getByType(TrueSheetBackground).findByType(View);
      expect(host.props.backgroundColor).toBeUndefined();
      expect(host.props.backgroundBlur).toBe('system-material');
      expect(StyleSheet.flatten(wrapper.props.style).backgroundColor).toBe(
        backgroundStyle.backgroundColor
      );

      rerender(<TrueSheet initialDetentIndex={0} testID="effect-background-host" />);
      expect(getByTestId('effect-background-host').props.backgroundBlur).toBeUndefined();
    });
  });

  it('should render TrueSheetOverlay children', () => {
    const { getByText } = render(
      <TrueSheetOverlay>
        <Text>Overlay Content</Text>
      </TrueSheetOverlay>
    );
    expect(getByText('Overlay Content')).toBeDefined();
  });

  it('should render with detents prop', () => {
    const { getByText } = render(
      <TrueSheet name="test" detents={[0.5, 1]} initialDetentIndex={0}>
        <Text>Detent Content</Text>
      </TrueSheet>
    );
    expect(getByText('Detent Content')).toBeDefined();
  });

  it('should render with style prop', () => {
    const { getByText } = render(
      <TrueSheet name="test" initialDetentIndex={0} style={{ padding: 20 }}>
        <Text>Styled Content</Text>
      </TrueSheet>
    );
    expect(getByText('Styled Content')).toBeDefined();
  });

  describe('Lazy Loading', () => {
    it('should not render native view content initially when initialDetentIndex is not set', () => {
      const { queryByText } = render(
        <TrueSheet name="lazy-test">
          <Text>Lazy Content</Text>
        </TrueSheet>
      );
      // Content should not be rendered immediately
      expect(queryByText('Lazy Content')).toBeNull();
    });

    it('should not render native view content when initialDetentIndex is -1', () => {
      const { queryByText } = render(
        <TrueSheet name="lazy-test-negative" initialDetentIndex={-1}>
          <Text>Lazy Content Negative</Text>
        </TrueSheet>
      );
      // Content should not be rendered
      expect(queryByText('Lazy Content Negative')).toBeNull();
    });

    it('should render native view content immediately when initialDetentIndex is set to valid index', () => {
      const { getByText } = render(
        <TrueSheet name="eager-test" initialDetentIndex={0}>
          <Text>Eager Content</Text>
        </TrueSheet>
      );
      // Content should be rendered immediately
      expect(getByText('Eager Content')).toBeDefined();
    });

    it('should render native view content without presentation when lazy is disabled', () => {
      const { getByText, getByTestId } = render(
        <TrueSheet name="non-lazy-test" lazy={false} testID="non-lazy-host">
          <Text>Non-Lazy Content</Text>
        </TrueSheet>
      );

      expect(getByText('Non-Lazy Content')).toBeDefined();
      expect(getByTestId('non-lazy-host').props.lazy).toBeUndefined();
    });

    it('should render native view content when lazy becomes disabled', () => {
      const sheet = (
        <TrueSheet name="deferred-non-lazy-test">
          <Text>Deferred Non-Lazy Content</Text>
        </TrueSheet>
      );
      const { queryByText, rerender } = render(sheet);

      expect(queryByText('Deferred Non-Lazy Content')).toBeNull();

      rerender(<TrueSheet {...sheet.props} lazy={false} />);

      expect(queryByText('Deferred Non-Lazy Content')).not.toBeNull();

      rerender(sheet);

      expect(queryByText('Deferred Non-Lazy Content')).not.toBeNull();
    });

    it('should keep non-lazy native view content mounted after dismiss', () => {
      const { getByTestId, queryByText } = render(
        <TrueSheet name="non-lazy-dismiss-test" lazy={false} testID="non-lazy-dismiss-host">
          <Text>Persistent Non-Lazy Content</Text>
        </TrueSheet>
      );

      act(() => {
        getByTestId('non-lazy-dismiss-host').props.onDidDismiss({
          nativeEvent: null,
        });
      });

      expect(queryByText('Persistent Non-Lazy Content')).not.toBeNull();
    });

    it('should present non-lazy content without waiting for another mount', async () => {
      const sheetRef = createRef<TrueSheet>();
      const onMountMock = jest.fn();
      render(
        <TrueSheet ref={sheetRef} name="non-lazy-present-test" lazy={false} onMount={onMountMock}>
          <Text>Ready Non-Lazy Content</Text>
        </TrueSheet>
      );

      await act(async () => {
        await sheetRef.current?.present();
      });

      expect(onMountMock).not.toHaveBeenCalled();
      expect(TrueSheetModule?.presentByRef).toHaveBeenCalledTimes(1);
    });

    it('should render native view content when present is called', async () => {
      const onMountMock = jest.fn();
      const { queryByText } = render(
        <TrueSheet name="present-test" onMount={onMountMock}>
          <Text>Present Content</Text>
        </TrueSheet>
      );

      // Initially content should not be rendered
      expect(queryByText('Present Content')).toBeNull();

      // Get the sheet instance
      const sheetRef = TrueSheet['instances']['present-test']!;
      expect(sheetRef).toBeDefined();

      // Trigger state change to render native view
      await act(async () => {
        await sheetRef.setState({ shouldRenderNativeView: true });
      });

      // Content should now be rendered after state update
      expect(queryByText('Present Content')).not.toBeNull();
    });

    it('should clean up native view content after dismiss', async () => {
      const onDidDismissMock = jest.fn();
      const { getByText, queryByText } = render(
        <TrueSheet name="dismiss-test" initialDetentIndex={0} onDidDismiss={onDidDismissMock}>
          <Text>Dismiss Content</Text>
        </TrueSheet>
      );

      // Content should be rendered initially
      expect(getByText('Dismiss Content')).toBeDefined();

      // Get the sheet instance and trigger dismiss
      const sheetRef = TrueSheet['instances']['dismiss-test']!;
      expect(sheetRef).toBeDefined();

      // Simulate dismiss event
      await act(async () => {
        sheetRef['onDidDismiss']({} as DidDismissEvent);
      });

      // Content should be cleaned up after dismiss
      expect(queryByText('Dismiss Content')).toBeNull();
      expect(onDidDismissMock).toHaveBeenCalled();
    });

    it('should render footer only when native view is rendered', () => {
      const { queryByText } = render(
        <TrueSheet name="lazy-footer-test" footer={<Text>Lazy Footer</Text>}>
          <Text>Lazy Body</Text>
        </TrueSheet>
      );

      // Neither content nor footer should be rendered initially
      expect(queryByText('Lazy Body')).toBeNull();
      expect(queryByText('Lazy Footer')).toBeNull();
    });

    it('should render footer when sheet is presented with initialDetentIndex', () => {
      const { getByText } = render(
        <TrueSheet
          name="eager-footer-test"
          initialDetentIndex={0}
          footer={<Text>Eager Footer</Text>}
        >
          <Text>Eager Body</Text>
        </TrueSheet>
      );

      // Both content and footer should be rendered
      expect(getByText('Eager Body')).toBeDefined();
      expect(getByText('Eager Footer')).toBeDefined();
    });

    it('should maintain shouldRenderNativeView state correctly through lifecycle', async () => {
      const { queryByText } = render(
        <TrueSheet name="lifecycle-test" initialDetentIndex={-1}>
          <Text>Lifecycle Content</Text>
        </TrueSheet>
      );

      // Initially not rendered (lazy)
      expect(queryByText('Lifecycle Content')).toBeNull();

      // Get the sheet instance
      const sheetRef = TrueSheet['instances']['lifecycle-test']!;
      expect(sheetRef).toBeDefined();

      // Simulate state change that would happen during present()
      await act(async () => {
        await sheetRef.setState({ shouldRenderNativeView: true });
      });

      // Content should now be rendered after state update
      expect(queryByText('Lifecycle Content')).not.toBeNull();
    });
  });

  describe('Dismiss Attempt', () => {
    it('should call onDismissAttempt when triggered', async () => {
      const onDismissAttemptMock = jest.fn();
      render(
        <TrueSheet
          name="dismiss-attempt-test"
          initialDetentIndex={0}
          dismissible={false}
          onDismissAttempt={onDismissAttemptMock}
        >
          <Text>Content</Text>
        </TrueSheet>
      );

      const sheetRef = TrueSheet['instances']['dismiss-attempt-test']!;

      await act(async () => {
        sheetRef['onDismissAttempt']({} as DismissAttemptEvent);
      });

      expect(onDismissAttemptMock).toHaveBeenCalled();
    });

    it('should report a back press on a non-dismissible sheet and consume it', async () => {
      const onDismissAttemptMock = jest.fn();
      render(
        <TrueSheet
          name="dismiss-attempt-back-test"
          initialDetentIndex={0}
          dismissible={false}
          onDismissAttempt={onDismissAttemptMock}
        >
          <Text>Content</Text>
        </TrueSheet>
      );

      const sheetRef = TrueSheet['instances']['dismiss-attempt-back-test']!;
      sheetRef['isPresented'] = true;
      sheetRef['isSheetVisible'] = true;

      expect(sheetRef['handleBackPress']()).toBe(true);
      expect(onDismissAttemptMock).toHaveBeenCalledTimes(1);
      expect(TrueSheetModule?.handleBackPress).not.toHaveBeenCalled();
    });

    it('should let a back press propagate when non-dismissible without a handler', async () => {
      render(
        <TrueSheet name="dismiss-attempt-propagate-test" initialDetentIndex={0} dismissible={false}>
          <Text>Content</Text>
        </TrueSheet>
      );

      const sheetRef = TrueSheet['instances']['dismiss-attempt-propagate-test']!;
      sheetRef['isPresented'] = true;
      sheetRef['isSheetVisible'] = true;

      expect(sheetRef['handleBackPress']()).toBe(false);
    });
  });

  describe('Focus/Blur Events', () => {
    it('should call onWillFocus when triggered', async () => {
      const onWillFocusMock = jest.fn();
      render(
        <TrueSheet name="will-focus-test" initialDetentIndex={0} onWillFocus={onWillFocusMock}>
          <Text>Content</Text>
        </TrueSheet>
      );

      const sheetRef = TrueSheet['instances']['will-focus-test']!;
      expect(sheetRef).toBeDefined();

      await act(async () => {
        sheetRef['onWillFocus']({} as WillFocusEvent);
      });

      expect(onWillFocusMock).toHaveBeenCalled();
    });

    it('should call onDidFocus when triggered', async () => {
      const onDidFocusMock = jest.fn();
      render(
        <TrueSheet name="did-focus-test" initialDetentIndex={0} onDidFocus={onDidFocusMock}>
          <Text>Content</Text>
        </TrueSheet>
      );

      const sheetRef = TrueSheet['instances']['did-focus-test']!;
      expect(sheetRef).toBeDefined();

      await act(async () => {
        sheetRef['onDidFocus']({} as DidFocusEvent);
      });

      expect(onDidFocusMock).toHaveBeenCalled();
    });

    it('should call onWillBlur when triggered', async () => {
      const onWillBlurMock = jest.fn();
      render(
        <TrueSheet name="will-blur-test" initialDetentIndex={0} onWillBlur={onWillBlurMock}>
          <Text>Content</Text>
        </TrueSheet>
      );

      const sheetRef = TrueSheet['instances']['will-blur-test']!;
      expect(sheetRef).toBeDefined();

      await act(async () => {
        sheetRef['onWillBlur']({} as WillBlurEvent);
      });

      expect(onWillBlurMock).toHaveBeenCalled();
    });

    it('should call onDidBlur when triggered', async () => {
      const onDidBlurMock = jest.fn();
      render(
        <TrueSheet name="did-blur-test" initialDetentIndex={0} onDidBlur={onDidBlurMock}>
          <Text>Content</Text>
        </TrueSheet>
      );

      const sheetRef = TrueSheet['instances']['did-blur-test']!;
      expect(sheetRef).toBeDefined();

      await act(async () => {
        sheetRef['onDidBlur']({} as DidBlurEvent);
      });

      expect(onDidBlurMock).toHaveBeenCalled();
    });
  });
});
