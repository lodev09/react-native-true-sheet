import { useCallback } from 'react';

import { TrueSheet } from '../../TrueSheet';
import type { PositionChangeEvent } from '../../TrueSheet.types';
import type { TrueSheetScreenProps } from './types';
import { useSheetScreenState } from './useSheetScreenState';

export const TrueSheetScreen = ({
  detentIndex,
  resizeKey,
  navigation,
  emit,
  routeKey,
  closing,
  detents,
  children,
  positionChangeHandler,
  ...sheetProps
}: TrueSheetScreenProps) => {
  const {
    ref,
    initialDetentIndex,
    eventHandlers: { onPositionChange, ...eventHandlers },
  } = useSheetScreenState({
    detentIndex,
    resizeKey,
    closing,
    navigation,
    routeKey,
    emit,
  });

  const handlePositionChange = useCallback(
    (e: PositionChangeEvent) => {
      onPositionChange(e);
      positionChangeHandler?.(e.nativeEvent);
    },
    [onPositionChange, positionChangeHandler]
  );

  return (
    <TrueSheet
      ref={ref}
      name={`navigation-sheet-${routeKey}`}
      initialDetentIndex={initialDetentIndex}
      detents={detents}
      onPositionChange={handlePositionChange}
      {...eventHandlers}
      {...sheetProps}
    >
      {children}
    </TrueSheet>
  );
};
