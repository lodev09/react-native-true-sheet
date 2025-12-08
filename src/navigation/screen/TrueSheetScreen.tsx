import { useCallback } from 'react';

import { TrueSheet } from '../../TrueSheet';
import type { PositionChangeEvent } from '../../TrueSheet.types';
import { useSheetScreenState, type TrueSheetScreenProps } from './useSheetScreenState';

export function TrueSheetScreen({
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
