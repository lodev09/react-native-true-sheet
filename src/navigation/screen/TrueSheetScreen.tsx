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
  const { ref, initialDetentIndex, emitEvent, eventHandlers } = useSheetScreenState({
    detentIndex,
    closing,
    navigation,
    routeKey,
    emit,
  });

  const onPositionChange = useCallback(
    (e: PositionChangeEvent) => emitEvent('sheetPositionChange', e.nativeEvent),
    [emitEvent]
  );

  return (
    <TrueSheet
      ref={ref}
      name={`navigation-sheet-${routeKey}`}
      initialDetentIndex={initialDetentIndex}
      detents={detents}
      onPositionChange={onPositionChange}
      {...eventHandlers}
      {...sheetProps}
    >
      {children}
    </TrueSheet>
  );
}
