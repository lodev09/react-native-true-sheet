import { forwardRef, useRef, type Ref, useImperativeHandle, useState } from 'react'
import { StyleSheet } from 'react-native'
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet'

import { DARK, DARK_BLUE, GRABBER_COLOR, SPACING } from '../utils'
import { Button, DemoContent, Footer, Input } from '../components'

interface PromptSheetProps extends TrueSheetProps {}

export const PromptSheet = forwardRef((props: PromptSheetProps, ref: Ref<TrueSheet>) => {
  const sheetRef = useRef<TrueSheet>(null)

  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleDismiss = () => {
    setIsSubmitted(false)
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

  return (
    <TrueSheet
      ref={sheetRef}
      dismissible={false}
      grabber={false}
      edgeToEdge
      name="prompt-sheet"
      sizes={['auto', 'large']}
      contentContainerStyle={styles.content}
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
      <DemoContent color={DARK_BLUE} />
      <Input />
      {isSubmitted && <Input />}
      <Button text="Submit" onPress={submit} />
      <Button text="Dismis" onPress={dismiss} />
    </TrueSheet>
  )
})

PromptSheet.displayName = 'PromptSheet'

const styles = StyleSheet.create({
  content: {
    padding: SPACING,
  },
})
