import { useEvent, useHandler } from 'react-native-reanimated'
import type { WillPresentEvent, DetentInfo } from '../TrueSheet.types'
import type { DependencyList } from 'react-native-reanimated/lib/typescript/hook/commonTypes'

type WillPresentHandler = (detentInfo: DetentInfo, context: Record<string, unknown>) => void

export const useWillPresentHandler = (
  handler: WillPresentHandler,
  dependencies: DependencyList = []
) => {
  const handlers = {
    onWillPresent: handler,
  }

  const { context, doDependenciesDiffer } = useHandler(handlers, dependencies)

  return useEvent<WillPresentEvent>(
    (event) => {
      'worklet'
      const { onWillPresent } = handlers
      if (onWillPresent && event.eventName.endsWith('onWillPresent')) {
        onWillPresent(event, context)
      }
    },
    ['onWillPresent'],
    doDependenciesDiffer
  )
}
