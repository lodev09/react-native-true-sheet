import React, {
  forwardRef,
  useRef,
  type Ref,
  useImperativeHandle,
  useState,
  useEffect,
} from 'react'
import { TextInput, View, type TextStyle, type ViewStyle } from 'react-native'
import { TrueSheet, type SheetSize, type TrueSheetProps } from '@lodev09/react-native-true-sheet'

import {
  BORDER_RADIUS,
  DARK,
  DARK_BLUE,
  FOOTER_HEIGHT,
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

  const [contentHeight, setContentHeight] = useState<number>()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [size, setSize] = useState<SheetSize>('auto')

  const handleDismiss = () => {
    setIsSubmitted(false)
    setSize('auto')
    console.log('Sheet prompt dismissed!')
  }

  const dismiss = async () => {
    await sheetRef.current?.dismiss()
    console.log('Sheet prompt dismiss asynced')
  }

  const submit = async () => {
    setIsSubmitted(true)
  }

  useImperativeHandle<TrueSheet | null, TrueSheet | null>(ref, () => sheetRef.current)

  useEffect(() => {
    if (isSubmitted && contentHeight) {
      setSize(contentHeight + FOOTER_HEIGHT)
    }
  }, [isSubmitted, contentHeight])

  return (
    <TrueSheet
      ref={sheetRef}
      name="prompt-sheet"
      sizes={[size, '80%']}
      contentContainerStyle={$content}
      blurTint="dark"
      backgroundColor={DARK}
      cornerRadius={12}
      grabberProps={{ color: GRABBER_COLOR }}
      onDismiss={handleDismiss}
      onPresent={({ index, value }) =>
        console.log(`Sheet prompt presented with size of ${value} at index: ${index}`)
      }
      onSizeChange={({ index, value }) => console.log(`Resized to:`, value, 'at index:', index)}
      FooterComponent={<Footer />}
      {...props}
    >
      <View onLayout={(e) => isSubmitted && setContentHeight(e.nativeEvent.layout.height)}>
        <DemoContent color={DARK_BLUE} text={random(RANDOM_TEXTS)} />
        <Input />
        {isSubmitted && <Input />}
        <Button text="Submit" onPress={submit} />
        <Button text="Dismis" onPress={dismiss} />
      </View>
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
  marginBottom: SPACING,
}

const $input: TextStyle = {
  fontSize: 16,
  height: SPACING * 3,
}
