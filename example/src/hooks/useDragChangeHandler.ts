import { useEvent, useHandler } from 'react-native-reanimated'
import type { DragChangeEvent, SizeInfo } from '@lodev09/react-native-true-sheet'
import type { DependencyList } from 'react'

type DragChangeHandler = (sizeInfo: SizeInfo, context: unknown) => void

export const useDragChangeHandler = (
  handler: DragChangeHandler,
  dependencies: DependencyList = []
) => {
  const handlers = {
    onDragChange: handler,
  }

  const { context, doDependenciesDiffer } = useHandler(handlers, dependencies as any)

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
