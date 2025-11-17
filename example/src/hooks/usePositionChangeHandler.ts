import { useEvent, useHandler } from 'react-native-reanimated'
import type { PositionChangeEvent, DetentInfo } from '@lodev09/react-native-true-sheet'
import type { DependencyList } from 'react'

type PositionChangeHandler = (detentInfo: DetentInfo, context: unknown) => void

export const usePositionChangeHandler = (
  handler: PositionChangeHandler,
  dependencies: DependencyList = []
) => {
  const handlers = {
    onPositionChange: handler,
  }

  const { context, doDependenciesDiffer } = useHandler(handlers, dependencies as any)

  return useEvent<PositionChangeEvent>(
    (event) => {
      'worklet'
      const { onPositionChange } = handlers
      if (onPositionChange && event.eventName.endsWith('onPositionChange')) {
        onPositionChange(event, context)
      }
    },
    ['onPositionChange'],
    doDependenciesDiffer
  )
}
