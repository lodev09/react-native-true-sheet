import { TrueSheet } from '../../TrueSheet';
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
  ...sheetProps
}: TrueSheetScreenProps) => {
  const { ref, initialDetentIndex, eventHandlers } = useSheetScreenState({
    detentIndex,
    resizeKey,
    closing,
    navigation,
    routeKey,
    emit,
  });

  return (
    <TrueSheet
      ref={ref}
      name={`navigation-sheet-${routeKey}`}
      initialDetentIndex={initialDetentIndex}
      detents={detents}
      {...eventHandlers}
      {...sheetProps}
    >
      {children}
    </TrueSheet>
  );
};
