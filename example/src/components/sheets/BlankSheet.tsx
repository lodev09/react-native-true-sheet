import { forwardRef, type Ref } from 'react'
import { StyleSheet, Text } from 'react-native'
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet'

import { $WHITE_TEXT, DARK, SPACING } from '../../utils'

interface BlankSheetProps extends TrueSheetProps {}

export const BlankSheet = forwardRef((props: BlankSheetProps, ref: Ref<TrueSheet>) => {
  return (
    <TrueSheet
      ref={ref}
      detents={[0.5, 1]}
      blurTint="dark"
      cornerRadius={12}
      edgeToEdge
      backgroundColor={DARK}
      keyboardMode="pan"
      style={styles.content}
      {...props}
    >
      <Text style={$WHITE_TEXT}>Blank Sheet</Text>
    </TrueSheet>
  )
})

const styles = StyleSheet.create({
  content: {
    padding: SPACING,
  },
})

BlankSheet.displayName = 'BlankSheet'
