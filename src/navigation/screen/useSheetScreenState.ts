import type { ParamListBase } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';

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
  PositionChangeEventPayload,
  WillBlurEvent,
  WillDismissEvent,
  WillFocusEvent,
  WillPresentEvent,
} from '../../TrueSheet.types';
import type {
  TrueSheetNavigationEventMap,
  TrueSheetNavigationHelpers,
  TrueSheetNavigationOptions,
  TrueSheetNavigationProp,
} from '../types';
import { TrueSheetActions } from '../TrueSheetRouter';

type EmitFn = TrueSheetNavigationHelpers['emit'];

export type TrueSheetScreenProps = Omit<TrueSheetNavigationOptions, 'detentIndex'> & {
  detentIndex: number;
  resizeKey?: number;
  navigation: TrueSheetNavigationProp<ParamListBase>;
  emit: EmitFn;
  routeKey: string;
  closing?: boolean;
  children: React.ReactNode;
};

export function useSheetScreenState(
  props: Pick<TrueSheetScreenProps, 'detentIndex' | 'closing' | 'navigation' | 'routeKey' | 'emit'>
) {
  const { detentIndex, closing, navigation, routeKey, emit } = props;

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
  }, [detentIndex]);

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

  const onWillPresent = useCallback(
    (e: WillPresentEvent) => emitEvent('sheetWillPresent', e.nativeEvent),
    [emitEvent]
  );

  const onDidPresent = useCallback(
    (e: DidPresentEvent) => emitEvent('sheetDidPresent', e.nativeEvent),
    [emitEvent]
  );

  const onWillDismiss = useCallback(
    (_e: WillDismissEvent) => emitEvent('sheetWillDismiss', undefined),
    [emitEvent]
  );

  const onDidDismiss = useCallback(() => {
    emitEvent('sheetDidDismiss', undefined);
    if (!isDismissedRef.current) {
      isDismissedRef.current = true;
      navigation.goBack();
    }
  }, [emitEvent, navigation]);

  const onDetentChange = useCallback(
    (e: DetentChangeEvent) => emitEvent('sheetDetentChange', e.nativeEvent),
    [emitEvent]
  );

  const onDragBegin = useCallback(
    (e: DragBeginEvent) => emitEvent('sheetDragBegin', e.nativeEvent),
    [emitEvent]
  );

  const onDragChange = useCallback(
    (e: DragChangeEvent) => emitEvent('sheetDragChange', e.nativeEvent),
    [emitEvent]
  );

  const onDragEnd = useCallback(
    (e: DragEndEvent) => emitEvent('sheetDragEnd', e.nativeEvent),
    [emitEvent]
  );

  const onWillFocus = useCallback(
    (_e: WillFocusEvent) => emitEvent('sheetWillFocus', undefined),
    [emitEvent]
  );

  const onDidFocus = useCallback(
    (_e: DidFocusEvent) => emitEvent('sheetDidFocus', undefined),
    [emitEvent]
  );

  const onWillBlur = useCallback(
    (_e: WillBlurEvent) => emitEvent('sheetWillBlur', undefined),
    [emitEvent]
  );

  const onDidBlur = useCallback(
    (_e: DidBlurEvent) => emitEvent('sheetDidBlur', undefined),
    [emitEvent]
  );

  return {
    ref,
    initialDetentIndex: initialDetentIndexRef.current,
    emitEvent,
    eventHandlers: {
      onWillPresent,
      onDidPresent,
      onWillDismiss,
      onDidDismiss,
      onDetentChange,
      onDragBegin,
      onDragChange,
      onDragEnd,
      onWillFocus,
      onDidFocus,
      onWillBlur,
      onDidBlur,
    },
  };
}
