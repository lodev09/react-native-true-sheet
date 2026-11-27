import { act, renderHook } from '@testing-library/react-native';

import type { TrueSheet } from '../../TrueSheet';
import type { WillPresentEvent } from '../../TrueSheet.types';
import { useSheetScreenState } from '../screen/useSheetScreenState';

const REMOVE = { type: 'REMOVE', source: 'sheet-route' };

const willPresentEvent = {
  nativeEvent: { index: 0, position: 0, detent: 0.5 },
} as WillPresentEvent;

const renderSheetScreenState = (dismiss = jest.fn(() => Promise.resolve())) => {
  const dispatch = jest.fn();
  const { result, rerender } = renderHook(
    ({ closing }: { closing: boolean }) =>
      useSheetScreenState({
        detentIndex: 0,
        closing,
        dispatch,
        routeKey: 'sheet-route',
        emit: jest.fn(),
      }),
    { initialProps: { closing: false } }
  );

  result.current.ref.current = { dismiss } as unknown as TrueSheet;

  return { result, rerender, dismiss, dispatch };
};

describe('useSheetScreenState', () => {
  it('should dismiss the sheet when the route starts closing', () => {
    const { rerender, dismiss } = renderSheetScreenState();

    rerender({ closing: true });

    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('should not dismiss a sheet that is already dismissing when the route starts closing', () => {
    const { result, rerender, dismiss } = renderSheetScreenState();

    act(() => {
      result.current.eventHandlers.onWillDismiss();
    });
    rerender({ closing: true });

    expect(dismiss).not.toHaveBeenCalled();
  });

  it('should hold back the auto-present of a route that closes before its sheet presents', async () => {
    const { result, rerender } = renderSheetScreenState();

    expect(result.current.initialDetentIndex).toBe(0);

    await act(async () => {
      rerender({ closing: true });
    });

    expect(result.current.initialDetentIndex).toBe(-1);
  });

  it('should keep the initial detent of a closing route whose sheet started presenting', async () => {
    const { result, rerender } = renderSheetScreenState();

    act(() => {
      result.current.eventHandlers.onWillPresent(willPresentEvent);
    });
    await act(async () => {
      rerender({ closing: true });
    });

    expect(result.current.initialDetentIndex).toBe(0);
  });

  it('should remove a route that closes before its sheet presents', async () => {
    const { rerender, dispatch } = renderSheetScreenState();

    await act(async () => {
      rerender({ closing: true });
    });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(REMOVE);
  });

  it('should remove a route that closes before its sheet presents when dismiss fails', async () => {
    const { rerender, dispatch } = renderSheetScreenState(
      jest.fn(() => Promise.reject(new Error('not found')))
    );

    await act(async () => {
      rerender({ closing: true });
    });

    expect(dispatch).toHaveBeenCalledWith(REMOVE);
  });

  it('should leave removal to didDismiss once the sheet started presenting', async () => {
    const { result, rerender, dispatch } = renderSheetScreenState();

    act(() => {
      result.current.eventHandlers.onWillPresent(willPresentEvent);
    });
    await act(async () => {
      rerender({ closing: true });
    });

    expect(dispatch).not.toHaveBeenCalled();

    act(() => {
      result.current.eventHandlers.onDidDismiss();
    });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(REMOVE);
  });
});
