import { useCallback } from 'react';
import type { PositionChangeEvent, PositionChangeEventPayload } from '../TrueSheet.types';

type PositionChangeHandler = (
  payload: PositionChangeEventPayload,
  context: Record<string, unknown>
) => void;

/**
 * Web implementation of useReanimatedPositionChangeHandler.
 *
 * Returns a simple callback wrapper. The worklet directive is ignored on web
 * since there's no native UI thread.
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
