import type { TrueSheetProps } from './TrueSheet.types'

interface TrueSheetFooterProps {
  Component?: TrueSheetProps['FooterComponent']
}

export const TrueSheetFooter = (props: TrueSheetFooterProps) => {
  const { Component } = props

  if (!Component) return null

  if (typeof Component !== 'function') {
    return Component
  }

  return <Component />
}
