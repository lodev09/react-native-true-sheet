import { scheduleOnRN } from 'react-native-worklets';
import { ReanimatedTrueSheet } from '../../reanimated/ReanimatedTrueSheet';
import { useSheetScreenState, type TrueSheetScreenProps } from './useSheetScreenState';

export function ReanimatedTrueSheetScreen({
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

  const { onPositionChange, ...restEventHandlers } = eventHandlers;

  return (
    <ReanimatedTrueSheet
      ref={ref}
      name={`navigation-sheet-${routeKey}`}
      initialDetentIndex={initialDetentIndex}
      detents={detents}
      onPositionChange={(e) => {
        'worklet';
        scheduleOnRN(onPositionChange, e);
      }}
      {...restEventHandlers}
      {...sheetProps}
    >
      {children}
    </ReanimatedTrueSheet>
  );
}
