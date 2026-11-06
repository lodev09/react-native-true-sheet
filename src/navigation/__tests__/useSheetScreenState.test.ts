import { act, renderHook } from '@testing-library/react-native';

import type { TrueSheet } from '../../TrueSheet';
import { useSheetScreenState } from '../screen/useSheetScreenState';

const renderSheetScreenState = () => {
  const { result, rerender } = renderHook(
    ({ closing }: { closing: boolean }) =>
      useSheetScreenState({
        detentIndex: 0,
        closing,
        dispatch: jest.fn(),
        routeKey: 'sheet-route',
        emit: jest.fn(),
      }),
    { initialProps: { closing: false } }
  );

  const dismiss = jest.fn();
  result.current.ref.current = { dismiss } as unknown as TrueSheet;

  return { result, rerender, dismiss };
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
});
