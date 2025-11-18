import { useEvent, useHandler } from 'react-native-reanimated'
import type { PositionChangeEvent, DetentInfo } from '../TrueSheet.types'
import type { DependencyList } from 'react-native-reanimated/lib/typescript/hook/commonTypes'

type PositionChangeHandler = (detentInfo: DetentInfo, context: Record<string, unknown>) => void

export const usePositionChangeHandler = (
  handler: PositionChangeHandler,
  dependencies: DependencyList = []
) => {
  const handlers = {
    onPositionChange: handler,
  }

  const { context, doDependenciesDiffer } = useHandler(handlers, dependencies)

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
