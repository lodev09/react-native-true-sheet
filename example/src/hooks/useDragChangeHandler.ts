import { useEvent, useHandler } from 'react-native-reanimated'
import type { DependencyList } from 'react-native-reanimated/lib/typescript/hook'
import type { DragChangeEvent, SizeInfo } from '@lodev09/react-native-true-sheet'

type DragChangeHandler = (sizeInfo: SizeInfo, context: unknown) => void

export const useDragChangeHandler = (
  handler: DragChangeHandler,
  dependencies: DependencyList = []
) => {
  const handlers = {
    onDragChange: handler,
  }

  const { context, doDependenciesDiffer } = useHandler(handlers, dependencies)

  return useEvent<DragChangeEvent>(
    (event) => {
      'worklet'
      const { onDragChange } = handlers
      if (onDragChange && event.eventName.endsWith('onDragChange')) {
        onDragChange(event, context)
      }
    },
    ['onDragChange'],
    doDependenciesDiffer
  )
}
