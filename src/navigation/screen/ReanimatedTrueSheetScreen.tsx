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

  const onPositionChange = useReanimatedPositionChangeHandler((payload) => {
    'worklet';
    emitEvent('sheetPositionChange', payload);
  });

  return (
    <AnimatedTrueSheet
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
    </AnimatedTrueSheet>
  );
}
