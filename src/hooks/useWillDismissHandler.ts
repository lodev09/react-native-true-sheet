import { useEvent, useHandler } from 'react-native-reanimated'
import type { WillDismissEvent } from '../TrueSheet.types'
import type { DependencyList } from 'react-native-reanimated/lib/typescript/hook/commonTypes'

type WillDismissHandler = (context: Record<string, unknown>) => void

export const useWillDismissHandler = (
  handler: WillDismissHandler,
  dependencies: DependencyList = []
) => {
  const handlers = {
    onWillDismiss: handler,
  }

  const { context, doDependenciesDiffer } = useHandler(handlers, dependencies)

  return useEvent<WillDismissEvent>(
    (event) => {
      'worklet'
      const { onWillDismiss } = handlers
      if (onWillDismiss && event.eventName.endsWith('onWillDismiss')) {
        onWillDismiss(context)
      }
    },
    ['onWillDismiss'],
    doDependenciesDiffer
  )
}
