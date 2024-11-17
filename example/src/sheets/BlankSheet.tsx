import React, { forwardRef, type Ref } from 'react'
import { StyleSheet, Text } from 'react-native'
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet'

import { $WHITE_TEXT, DARK, SPACING } from '../utils'

interface BlankSheetProps extends TrueSheetProps {}

export const BlankSheet = forwardRef((props: BlankSheetProps, ref: Ref<TrueSheet>) => {
  return (
    <TrueSheet
      ref={ref}
      sizes={['medium', 'large']}
      blurTint="dark"
      cornerRadius={12}
      backgroundColor={DARK}
      keyboardMode="pan"
      contentContainerStyle={styles.content}
      {...props}
    >
      <Text style={$WHITE_TEXT}>Blank Sheet</Text>
    </TrueSheet>
  )
})

BlankSheet.displayName = 'BlankSheet'

const styles = StyleSheet.create({
  content: {
    padding: SPACING,
  },
})
