import Animated from 'react-native-reanimated';

import { TrueSheet } from '../../TrueSheet';
import { useReanimatedPositionChangeHandler } from '../../reanimated/useReanimatedPositionChangeHandler';
import { useSheetScreenState, type TrueSheetScreenProps } from './useSheetScreenState';

const AnimatedTrueSheet = Animated.createAnimatedComponent(TrueSheet);

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
  const { ref, initialDetentIndex, emitEvent, eventHandlers } = useSheetScreenState({
    detentIndex,
    closing,
    navigation,
    routeKey,
    emit,
  });

  const onPositionChange = useReanimatedPositionChangeHandler((payload) => {
    'worklet';
    emitEvent('sheetPositionChange', payload);
  });

  return (
    <AnimatedTrueSheet
      ref={ref}
      name={`navigation-sheet-${routeKey}`}
      initialDetentIndex={initialDetentIndex}
      detents={detents}
      onPositionChange={onPositionChange}
      {...eventHandlers}
      {...sheetProps}
    >
      {children}
    </AnimatedTrueSheet>
  );
}
