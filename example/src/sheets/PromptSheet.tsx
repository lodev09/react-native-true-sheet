import React, { forwardRef, useRef, type Ref, useImperativeHandle } from 'react'
import { TextInput, View, type TextStyle, type ViewStyle } from 'react-native'
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet'

import {
  BORDER_RADIUS,
  DARK,
  DARK_BLUE,
  GRABBER_COLOR,
  GRAY,
  INPUT_HEIGHT,
  RANDOM_TEXTS,
  SPACING,
  random,
} from '../utils'
import { Button, DemoContent, Footer } from '../components'

interface PromptSheetProps extends TrueSheetProps {}

export const PromptSheet = forwardRef((props: PromptSheetProps, ref: Ref<TrueSheet>) => {
  const sheetRef = useRef<TrueSheet>(null)

  const dismiss = async () => {
    await sheetRef.current?.dismiss()
    console.log('Sheet prompt dismiss asynced')
  }

  useImperativeHandle<TrueSheet | null, TrueSheet | null>(ref, () => sheetRef.current)

  return (
    <TrueSheet
      ref={sheetRef}
      sizes={['auto', '80%']}
      contentContainerStyle={$content}
      blurTint="dark"
      backgroundColor={DARK}
      cornerRadius={12}
      grabberProps={{ color: GRABBER_COLOR }}
      onDismiss={() => console.log('Sheet prompt dismissed!')}
      onPresent={({ index, value }) =>
        console.log(`Sheet prompt presented with size of ${value} at index: ${index}`)
      }
      onSizeChange={({ index, value }) => console.log(`Resized to:`, value, 'at index:', index)}
      FooterComponent={<Footer />}
      {...props}
    >
      <DemoContent color={DARK_BLUE} text={random(RANDOM_TEXTS)} />
      <Input />
      <Button text="Dismis" onPress={dismiss} />
    </TrueSheet>
  )
})

PromptSheet.displayName = 'PromptSheet'

const Input = () => {
  return (
    <View style={$inputContainer}>
      <TextInput style={$input} placeholder="Enter some text..." placeholderTextColor={GRAY} />
    </View>
  )
}

const $content: ViewStyle = {
  padding: SPACING,
}

const $inputContainer: ViewStyle = {
  backgroundColor: 'white',
  paddingHorizontal: SPACING,
  height: INPUT_HEIGHT,
  borderRadius: BORDER_RADIUS,
  justifyContent: 'center',
  marginBottom: SPACING * 2,
}

const $input: TextStyle = {
  fontSize: 16,
  height: SPACING * 3,
}
