import Animated from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useReanimatedPositionChangeHandler } from '../../reanimated';
import { TrueSheet } from '../../TrueSheet';
import type { PositionChangeEvent } from '../../TrueSheet.types';
import type { TrueSheetScreenProps } from './types';
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

  const reanimatedPositionChangeHandler = useReanimatedPositionChangeHandler(
    (payload) => {
      'worklet';
      positionChangeHandler?.(payload);
      scheduleOnRN(onPositionChange, {
        nativeEvent: payload,
      } as PositionChangeEvent);
    },
    [onPositionChange, positionChangeHandler]
  );

  return (
    <AnimatedTrueSheet
      ref={ref}
      name={`navigation-sheet-${routeKey}`}
      initialDetentIndex={initialDetentIndex}
      detents={detents}
      onPositionChange={reanimatedPositionChangeHandler}
      {...eventHandlers}
      {...sheetProps}
    >
      {children}
    </AnimatedTrueSheet>
  );
};
