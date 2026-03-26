import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
import type {
  TrueSheetNavigationEventMap,
  TrueSheetNavigationHelpers,
  TrueSheetNavigationProp,
} from '../types';
import { TrueSheetActions } from '../TrueSheetRouter';
import { useFocusEffect, type ParamListBase } from '@react-navigation/native';

type EmitFn = TrueSheetNavigationHelpers['emit'];

interface UseSheetScreenStateProps {
  detentIndex: number;
  resizeKey?: number;
  closing?: boolean;
  navigation: TrueSheetNavigationProp<ParamListBase>;
  routeKey: string;
  emit: EmitFn;
}

export const useSheetScreenState = (props: UseSheetScreenStateProps) => {
  const { detentIndex, resizeKey, closing, navigation, routeKey, emit } = props;

  const ref = useRef<TrueSheet>(null);
  const isDismissedRef = useRef(false);
  const isFirstRenderRef = useRef(true);
  const initialDetentIndexRef = useRef(detentIndex);

  const [didPresent, setDidPresent] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!didPresent) {
        ref.current?.present();
      }
    }, [didPresent])
  );

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
      } as Parameters<EmitFn>[0]);
    },
    [emit, routeKey]
  );

  const onDidPresent = useCallback(
    (e: DidPresentEvent) => {
      setDidPresent(true);
      emitEvent('sheetDidPresent', e.nativeEvent);
    },
    [emitEvent]
  );

  const onDidDismiss = useCallback(() => {
    emitEvent('sheetDidDismiss', undefined);
    isDismissedRef.current = true;
    navigation.dispatch({ ...TrueSheetActions.remove(), source: routeKey });
  }, [emitEvent, navigation, routeKey]);

  const eventHandlers = useMemo(
    () => ({
      onWillPresent: (e: WillPresentEvent) => emitEvent('sheetWillPresent', e.nativeEvent),
      onDidPresent: onDidPresent,
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
    initialDetentIndex: initialDetentIndexRef.current,
    emitEvent,
    eventHandlers,
  };
};
