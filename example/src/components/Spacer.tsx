import React from 'react'
import { View, type ViewProps } from 'react-native'

import { SPACING } from '../utils'

interface SpacerProps extends ViewProps {
  space?: number
}

export const Spacer = (props: SpacerProps) => {
  const { space = SPACING, style: $styleOverride, ...rest } = props
  return <View style={[{ height: space }, $styleOverride]} {...rest} />
}
