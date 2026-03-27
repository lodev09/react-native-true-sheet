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
      {...sheetProps}
      {...eventHandlers}
    >
      {children}
    </TrueSheet>
  );
};
