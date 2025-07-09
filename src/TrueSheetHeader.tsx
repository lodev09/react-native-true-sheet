import type { TrueSheetProps } from './TrueSheet.types'

interface TrueSheetHeaderProps {
  Component?: TrueSheetProps['HeaderComponent']
}

export const TrueSheetHeader = (props: TrueSheetHeaderProps) => {
  const { Component } = props

  if (!Component) return null

  if (typeof Component !== 'function') {
    return Component
  }

  return <Component />
}
