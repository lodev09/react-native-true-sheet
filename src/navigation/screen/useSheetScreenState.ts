import { useCallback, useEffect, useMemo, useRef } from 'react';

import { TrueSheet } from '../../TrueSheet';
import type {
  DetentChangeEvent,
  DetentInfoEventPayload,
  DidBlurEvent,
  DidFocusEvent,
  DidPresentEvent,
  DragBeginEvent,
  DragChangeEvent,
  DragEndEvent,
  PositionChangeEvent,
  PositionChangeEventPayload,
  WillBlurEvent,
  WillDismissEvent,
  WillFocusEvent,
  WillPresentEvent,
} from '../../TrueSheet.types';
import type { TrueSheetDispatch, TrueSheetEmitFn, TrueSheetNavigationEventMap } from '../types';
import { TrueSheetActions } from '../actions';

interface UseSheetScreenStateProps {
  detentIndex: number;
  resizeKey?: number;
  closing?: boolean;
  dispatch: TrueSheetDispatch;
  routeKey: string;
  emit: TrueSheetEmitFn;
}

export const useSheetScreenState = (props: UseSheetScreenStateProps) => {
  const { detentIndex, resizeKey, closing, dispatch, routeKey, emit } = props;

  const ref = useRef<TrueSheet>(null);
  const isDismissedRef = useRef(false);
  const isFirstRenderRef = useRef(true);
  const initialDetentIndexRef = useRef(detentIndex);

  // Present imperatively instead of via `initialDetentIndex` so the present
  // waits for the screen's mount effects — options set there (e.g. a footer
  // via `setOptions`) are committed before the sheet measures its detents,
  // otherwise the sheet visibly grows when the footer lands mid-presentation.
  useEffect(() => {
    ref.current?.present(initialDetentIndexRef.current);
  }, []);

  useEffect(() => {
    if (closing && !isDismissedRef.current) {
      isDismissedRef.current = true;
      ref.current?.dismiss();
    }
  }, [closing]);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    ref.current?.resize(detentIndex);
  }, [detentIndex, resizeKey]);

  const emitEvent = useCallback(
    (
      type: keyof TrueSheetNavigationEventMap,
      data: DetentInfoEventPayload | PositionChangeEventPayload | undefined
    ) => {
      emit({
        type,
        target: routeKey,
        data,
      } as Parameters<TrueSheetEmitFn>[0]);
    },
    [emit, routeKey]
  );

  const onDidDismiss = useCallback(() => {
    emitEvent('sheetDidDismiss', undefined);
    isDismissedRef.current = true;
    dispatch({ ...TrueSheetActions.remove(), source: routeKey });
  }, [emitEvent, dispatch, routeKey]);

  const eventHandlers = useMemo(
    () => ({
      onWillPresent: (e: WillPresentEvent) => emitEvent('sheetWillPresent', e.nativeEvent),
      onDidPresent: (e: DidPresentEvent) => emitEvent('sheetDidPresent', e.nativeEvent),
      onWillDismiss: (_e: WillDismissEvent) => emitEvent('sheetWillDismiss', undefined),
      onDidDismiss,
      onDetentChange: (e: DetentChangeEvent) => emitEvent('sheetDetentChange', e.nativeEvent),
      onDragBegin: (e: DragBeginEvent) => emitEvent('sheetDragBegin', e.nativeEvent),
      onDragChange: (e: DragChangeEvent) => emitEvent('sheetDragChange', e.nativeEvent),
      onDragEnd: (e: DragEndEvent) => emitEvent('sheetDragEnd', e.nativeEvent),
      onPositionChange: (e: PositionChangeEvent) => emitEvent('sheetPositionChange', e.nativeEvent),
      onWillFocus: (_e: WillFocusEvent) => emitEvent('sheetWillFocus', undefined),
      onDidFocus: (_e: DidFocusEvent) => emitEvent('sheetDidFocus', undefined),
      onWillBlur: (_e: WillBlurEvent) => emitEvent('sheetWillBlur', undefined),
      onDidBlur: (_e: DidBlurEvent) => emitEvent('sheetDidBlur', undefined),
    }),
    [emitEvent, onDidDismiss]
  );

  return {
    ref,
    emitEvent,
    eventHandlers,
  };
};
