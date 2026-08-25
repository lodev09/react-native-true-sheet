/* eslint-disable dot-notation -- bracket access reaches TrueSheet's private test hooks with full typing */
import { createRef } from 'react';
import { Text } from 'react-native';
import { render, act } from '@testing-library/react-native';
import { TrueSheet, TrueSheetPeek } from '../index';
import TrueSheetModule from '../specs/NativeTrueSheetModule';
import type {
  DidDismissEvent,
  WillFocusEvent,
  DidFocusEvent,
  WillBlurEvent,
  DidBlurEvent,
} from '../TrueSheet.types';

describe('TrueSheet', () => {
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
