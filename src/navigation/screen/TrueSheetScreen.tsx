import { TrueSheet } from '../../TrueSheet';
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
  const { ref, initialDetentIndex, eventHandlers } = useSheetScreenState({
    detentIndex,
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
}
