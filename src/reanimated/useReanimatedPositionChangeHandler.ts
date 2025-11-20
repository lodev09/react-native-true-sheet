import { useEvent, useHandler } from 'react-native-reanimated';
import type { PositionChangeEvent, PositionChangeEventPayload } from '../TrueSheet.types';
import type { DependencyList } from 'react-native-reanimated/lib/typescript/hook/commonTypes';

type PositionChangeHandler = (
  payload: PositionChangeEventPayload,
  context: Record<string, unknown>
) => void;

export const useReanimatedPositionChangeHandler = (
  handler: PositionChangeHandler,
  dependencies: DependencyList = []
) => {
  const { context, doDependenciesDiffer } = useHandler({ onPositionChange: handler }, dependencies);

  return useEvent<PositionChangeEvent>(
    (event) => {
      'worklet';
      if (handler && event.eventName.endsWith('onPositionChange')) {
        handler(event, context);
      }
    },
    ['onPositionChange'],
    doDependenciesDiffer
  );
};
