import Animated from 'react-native-reanimated';

import { TrueSheet } from '../../TrueSheet';
import type { ReanimatedTrueSheetScreenProps } from './types';
import { useSheetScreenState } from './useSheetScreenState';

const AnimatedTrueSheet = Animated.createAnimatedComponent(TrueSheet);

export const ReanimatedTrueSheetScreen = ({
  detentIndex,
  resizeKey,
  navigation,
  emit,
  routeKey,
  closing,
  detents,
  children,
  reanimatedPositionChangeHandler,
  ...sheetProps
}: ReanimatedTrueSheetScreenProps) => {
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

  return (
    <AnimatedTrueSheet
      ref={ref}
      name={`navigation-sheet-${routeKey}`}
      initialDetentIndex={initialDetentIndex}
      detents={detents}
      onPositionChange={reanimatedPositionChangeHandler ?? onPositionChange}
      {...eventHandlers}
      {...sheetProps}
    >
      {children}
    </AnimatedTrueSheet>
  );
};
