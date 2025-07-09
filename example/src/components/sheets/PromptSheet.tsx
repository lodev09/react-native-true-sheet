import { forwardRef, useRef, type Ref, useImperativeHandle, useState } from 'react'
import { StyleSheet } from 'react-native'
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet'

import { DARK, DARK_BLUE, GRABBER_COLOR, SPACING } from '../../utils'
import { DemoContent } from '../DemoContent'
import { Input } from '../Input'
import { Button } from '../Button'
import { Footer } from '../Footer'

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
      sizes={['auto']}
      contentContainerStyle={styles.content}
      blurTint="dark"
      backgroundColor={DARK}
      cornerRadius={12}
      grabberProps={{ color: GRABBER_COLOR }}
      onDismiss={handleDismiss}
      onPresent={(e) =>
        console.log(
          `Sheet prompt presented with size of ${e.nativeEvent.value} at index: ${e.nativeEvent.index}`
        )
      }
      onSizeChange={(e) =>
        console.log(`Resized to:`, e.nativeEvent.value, 'at index:', e.nativeEvent.index)
      }
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

const styles = StyleSheet.create({
  content: {
    padding: SPACING,
  },
})

PromptSheet.displayName = 'PromptSheet'
