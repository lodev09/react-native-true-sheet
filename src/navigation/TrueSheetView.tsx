import type { ParamListBase } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef } from 'react';
import Animated from 'react-native-reanimated';

import { TrueSheet } from '../TrueSheet';
import { useReanimatedPositionChangeHandler } from '../reanimated/useReanimatedPositionChangeHandler';
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
} from '../TrueSheet.types';
import type {
  TrueSheetDescriptorMap,
  TrueSheetNavigationEventMap,
  TrueSheetNavigationHelpers,
  TrueSheetNavigationOptions,
  TrueSheetNavigationProp,
  TrueSheetNavigationState,
} from './types';
import { TrueSheetActions } from './TrueSheetRouter';

const AnimatedTrueSheet = Animated.createAnimatedComponent(TrueSheet);

type EmitFn = TrueSheetNavigationHelpers['emit'];

type TrueSheetScreenProps = Omit<TrueSheetNavigationOptions, 'detentIndex'> & {
  detentIndex: number;
  resizeKey?: number;
  navigation: TrueSheetNavigationProp<ParamListBase>;
  emit: EmitFn;
  routeKey: string;
  closing?: boolean;
  children: React.ReactNode;
};

function useSheetScreenState(
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
    initialDetentIndexRef,
    emitEvent,
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
  };
}

function TrueSheetScreen({
  detentIndex,
  resizeKey: _resizeKey,
  navigation,
  emit,
  routeKey,
  closing,
  detents,
  children,
  ...sheetProps
}: TrueSheetScreenProps) {
  const {
    ref,
    initialDetentIndexRef,
    emitEvent,
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
  } = useSheetScreenState({ detentIndex, closing, navigation, routeKey, emit });

  const onPositionChange = useCallback(
    (e: PositionChangeEvent) => emitEvent('sheetPositionChange', e.nativeEvent),
    [emitEvent]
  );

  return (
    <TrueSheet
      ref={ref}
      name={`navigation-sheet-${routeKey}`}
      initialDetentIndex={initialDetentIndexRef.current}
      detents={detents}
      onWillPresent={onWillPresent}
      onDidPresent={onDidPresent}
      onWillDismiss={onWillDismiss}
      onDidDismiss={onDidDismiss}
      onDetentChange={onDetentChange}
      onDragBegin={onDragBegin}
      onDragChange={onDragChange}
      onDragEnd={onDragEnd}
      onPositionChange={onPositionChange}
      onWillFocus={onWillFocus}
      onDidFocus={onDidFocus}
      onWillBlur={onWillBlur}
      onDidBlur={onDidBlur}
      {...sheetProps}
    >
      {children}
    </TrueSheet>
  );
}

function ReanimatedTrueSheetScreen({
  detentIndex,
  resizeKey: _resizeKey,
  navigation,
  emit,
  routeKey,
  closing,
  detents,
  children,
  ...sheetProps
}: TrueSheetScreenProps) {
  const {
    ref,
    initialDetentIndexRef,
    emitEvent,
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
  } = useSheetScreenState({ detentIndex, closing, navigation, routeKey, emit });

  const onPositionChange = useReanimatedPositionChangeHandler((payload) => {
    'worklet';
    emitEvent('sheetPositionChange', payload);
  });

  return (
    <AnimatedTrueSheet
      ref={ref}
      name={`navigation-sheet-${routeKey}`}
      initialDetentIndex={initialDetentIndexRef.current}
      detents={detents}
      onWillPresent={onWillPresent}
      onDidPresent={onDidPresent}
      onWillDismiss={onWillDismiss}
      onDidDismiss={onDidDismiss}
      onDetentChange={onDetentChange}
      onDragBegin={onDragBegin}
      onDragChange={onDragChange}
      onDragEnd={onDragEnd}
      onPositionChange={onPositionChange}
      onWillFocus={onWillFocus}
      onDidFocus={onDidFocus}
      onWillBlur={onWillBlur}
      onDidBlur={onDidBlur}
      {...sheetProps}
    >
      {children}
    </AnimatedTrueSheet>
  );
}

const DEFAULT_DETENTS: ('auto' | number)[] = ['auto'];

function clampDetentIndex(index: number, detentsLength: number): number {
  return Math.min(index, Math.max(detentsLength - 1, 0));
}

interface TrueSheetViewProps {
  state: TrueSheetNavigationState<ParamListBase>;
  navigation: TrueSheetNavigationHelpers;
  descriptors: TrueSheetDescriptorMap;
  useReanimated?: boolean;
}

export function TrueSheetView({
  state,
  navigation,
  descriptors,
  useReanimated,
}: TrueSheetViewProps) {
  // First route is the base screen, rest are sheets
  const [baseRoute, ...sheetRoutes] = state.routes;

  const baseDescriptor = baseRoute ? descriptors[baseRoute.key] : null;

  const ScreenComponent = useReanimated ? ReanimatedTrueSheetScreen : TrueSheetScreen;

  return (
    <>
      {/* Render base screen */}
      {baseDescriptor?.render()}

      {/* Render sheet screens */}
      {sheetRoutes.map((route) => {
        const descriptor = descriptors[route.key];

        if (!descriptor) {
          return null;
        }

        const { options, navigation: screenNavigation, render } = descriptor;
        const { detentIndex = 0, detents = DEFAULT_DETENTS, ...sheetProps } = options;
        const resolvedIndex = clampDetentIndex(route.resizeIndex ?? detentIndex, detents.length);

        return (
          <ScreenComponent
            key={route.key}
            routeKey={route.key}
            closing={route.closing}
            detentIndex={resolvedIndex}
            resizeKey={route.resizeKey}
            detents={detents}
            navigation={screenNavigation}
            emit={navigation.emit}
            {...sheetProps}
          >
            {render()}
          </ScreenComponent>
        );
      })}
    </>
  );
}
