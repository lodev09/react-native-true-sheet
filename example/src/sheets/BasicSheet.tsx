import React, { forwardRef, useRef, type Ref, useImperativeHandle } from 'react'
import { type ViewStyle } from 'react-native'
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet'

import { DARK, DARK_BLUE, GRABBER_COLOR, RANDOM_TEXTS, SPACING, random } from '../utils'
import { Button, DemoContent, Footer } from '../components'

interface BasicSheetProps extends TrueSheetProps {}

export const BasicSheet = forwardRef((props: BasicSheetProps, ref: Ref<TrueSheet>) => {
  const sheetRef = useRef<TrueSheet>(null)

  const resize = async (index: number) => {
    await sheetRef.current?.resize(index)
    console.log(`Basic sheet resize to ${index} async`)
  }

  const dismiss = async () => {
    await sheetRef.current?.dismiss()
    console.log('Basic sheet dismiss asynced')
  }

  useImperativeHandle<TrueSheet | null, TrueSheet | null>(ref, () => sheetRef.current)

  return (
    <TrueSheet
      sizes={['auto', '80%', 'large']}
      ref={sheetRef}
      contentContainerStyle={$content}
      blurTint="dark"
      backgroundColor={DARK}
      cornerRadius={12}
      grabberProps={{ color: GRABBER_COLOR }}
      onDismiss={() => console.log('Basic sheet dismissed!')}
      onPresent={({ index, value }) =>
        console.log(`Basic sheet presented with size of ${value} at index: ${index}`)
      }
      onSizeChange={({ index, value }) => console.log(`Resized to:`, value, 'at index:', index)}
      FooterComponent={<Footer />}
      {...props}
    >
      <DemoContent color={DARK_BLUE} text={random(RANDOM_TEXTS)} />
      <Button text="Present Large" onPress={() => resize(2)} />
      <Button text="Present 80%" onPress={() => resize(1)} />
      <Button text="Present Auto" onPress={() => resize(0)} />
      <Button text="Dismis" onPress={dismiss} />
    </TrueSheet>
  )
})

BasicSheet.displayName = 'BasicSheet'

const $content: ViewStyle = {
  padding: SPACING,
}
