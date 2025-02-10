import { useEvent, useHandler } from 'react-native-reanimated'
import type { DependencyList } from 'react-native-reanimated/lib/typescript/hook'
import type { DragChangeEvent, SizeInfo } from '@lodev09/react-native-true-sheet'

type PageScrollHandler = (sizeInfo: SizeInfo, context: unknown) => void

export const useDragChangeHandler = (
  handler: PageScrollHandler,
  dependencies: DependencyList = []
) => {
  const handlers = {
    onDragChange: handler,
  }

  const { context, doDependenciesDiffer } = useHandler(
    {
      onDragChange: handler,
    },
    dependencies
  )

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
