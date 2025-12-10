import { useCallback } from 'react';
import type { PositionChangeEvent, PositionChangeEventPayload } from '../TrueSheet.types';

type PositionChangeHandler = (
  payload: PositionChangeEventPayload,
  context: Record<string, unknown>
) => void;

/**
 * Web implementation of useReanimatedPositionChangeHandler.
 *
 * On web, this returns a simple callback wrapper since @gorhom/bottom-sheet
 * already provides animated position values. The worklet directive is ignored
 * on web as there's no native UI thread.
 *
 * @param handler - The position change handler function
 * @param _dependencies - Unused on web, kept for API compatibility
 * @returns An event handler compatible with onPositionChange prop
 */
export const useReanimatedPositionChangeHandler = (
  handler: PositionChangeHandler,
  _dependencies: unknown[] = []
) => {
  const context: Record<string, unknown> = {};

  return useCallback(
    (event: PositionChangeEvent) => {
      handler(event.nativeEvent, context);
    },
    [handler]
  );
};
