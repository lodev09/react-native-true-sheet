import { useEffect, useRef } from 'react';

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
import type { TrueSheetNavigationEventMap, TrueSheetNavigationHelpers } from '../types';
import { TrueSheetActions } from '../TrueSheetRouter';
import type { TrueSheetScreenProps } from './types';

type EmitFn = TrueSheetNavigationHelpers['emit'];

export const useSheetScreenState = (
  props: Pick<
    TrueSheetScreenProps,
    'detentIndex' | 'resizeKey' | 'closing' | 'navigation' | 'routeKey' | 'emit'
  >
) => {
  const { detentIndex, resizeKey, closing, navigation, routeKey, emit } = props;

  const ref = useRef<TrueSheet>(null);
  const isDismissedRef = useRef(false);
  const isFirstRenderRef = useRef(true);
  const initialDetentIndexRef = useRef(detentIndex);

  useEffect(() => {
    if (closing && !isDismissedRef.current) {
      isDismissedRef.current = true;
      (async () => {
        await ref.current?.dismiss();
        navigation.dispatch({ ...TrueSheetActions.remove(), source: routeKey });
      })();
    } else if (closing && isDismissedRef.current) {
      navigation.dispatch({ ...TrueSheetActions.remove(), source: routeKey });
    }
  }, [closing, navigation, routeKey]);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    ref.current?.resize(detentIndex);
  }, [detentIndex, resizeKey]);

  const emitEvent = (
    type: keyof TrueSheetNavigationEventMap,
    data: DetentInfoEventPayload | PositionChangeEventPayload | undefined
  ) => {
    emit({
      type,
      target: routeKey,
      data,
    } as Parameters<EmitFn>[0]);
  };

  const onDidDismiss = () => {
    emitEvent('sheetDidDismiss', undefined);
    if (!isDismissedRef.current) {
      isDismissedRef.current = true;
      navigation.goBack();
    }
  };

  return {
    ref,
    initialDetentIndex: initialDetentIndexRef.current,
    emitEvent,
    eventHandlers: {
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
    },
  };
};
