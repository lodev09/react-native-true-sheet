import { forwardRef, useRef, type Ref, useImperativeHandle, useState } from 'react'
import { StyleSheet } from 'react-native'
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet'

import { DARK, DARK_BLUE, FOOTER_HEIGHT, GAP, GRABBER_COLOR, SPACING } from '../../utils'
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
      detents={['auto']}
      style={styles.content}
      blurTint="dark"
      backgroundColor={DARK}
      cornerRadius={12}
      grabberProps={{ color: GRABBER_COLOR }}
      onDidDismiss={handleDismiss}
      onDidPresent={(e) =>
        console.log(
          `Sheet prompt presented at index: ${e.nativeEvent.index}, position: ${e.nativeEvent.position}`
        )
      }
      onDetentChange={(e) =>
        console.log(
          `Detent changed to index:`,
          e.nativeEvent.index,
          'position:',
          e.nativeEvent.position
        )
      }
      footer={<Footer />}
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
    paddingBottom: FOOTER_HEIGHT + SPACING,
    gap: GAP,
  },
})

PromptSheet.displayName = 'PromptSheet'
