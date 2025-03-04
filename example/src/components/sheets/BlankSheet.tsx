import { forwardRef, type Ref } from 'react'
import { Text, type ViewStyle } from 'react-native'
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet'

import { $WHITE_TEXT, DARK, SPACING } from '../../utils'

interface BlankSheetProps extends TrueSheetProps {}

export const BlankSheet = forwardRef((props: BlankSheetProps, ref: Ref<TrueSheet>) => {
  return (
    <TrueSheet
      ref={ref}
      sizes={['medium', 'large']}
      blurTint="dark"
      cornerRadius={12}
      edgeToEdge
      backgroundColor={DARK}
      keyboardMode="pan"
      contentContainerStyle={$content}
      {...props}
    >
      <Text style={$WHITE_TEXT}>Blank Sheet</Text>
    </TrueSheet>
  )
})

const $content: ViewStyle = {
  padding: SPACING,
}

BlankSheet.displayName = 'BlankSheet'
