import { forwardRef, useRef, type Ref, useImperativeHandle } from 'react'
import { StyleSheet } from 'react-native'
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet'

import { DARK, DARK_BLUE, GRABBER_COLOR, SPACING } from '../utils'
import { Button, DemoContent, Footer, Spacer } from '../components'

interface BasicSheetProps extends TrueSheetProps {}

export const BasicSheet = forwardRef((props: BasicSheetProps, ref: Ref<TrueSheet>) => {
  const sheetRef = useRef<TrueSheet>(null)
  const childSheet = useRef<TrueSheet>(null)

  const resize = async (index: number) => {
    await sheetRef.current?.resize(index)
    console.log(`Basic sheet resize to ${index} async`)
  }

  const dismiss = async () => {
    await sheetRef.current?.dismiss()
    console.log('Basic sheet dismiss asynced')
  }

  const presentChild = async () => {
    // Note: no need to dismiss this sheet 😎
    await childSheet.current?.present()

    console.log('Child sheet presented!')
  }

  const presentPromptSheet = async () => {
    // Note: we need to dismiss this sheet first
    await sheetRef.current?.dismiss()

    await TrueSheet.present('prompt-sheet')
  }

  useImperativeHandle<TrueSheet | null, TrueSheet | null>(ref, () => sheetRef.current)

  return (
    <TrueSheet
      sizes={['auto', '80%', 'large']}
      ref={sheetRef}
      contentContainerStyle={styles.content}
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
      <DemoContent color={DARK_BLUE} />
      <Button text="Present Large" onPress={() => resize(2)} />
      <Button text="Present 80%" onPress={() => resize(1)} />
      <Button text="Present Auto" onPress={() => resize(0)} />
      <Spacer />
      <Button text="Present Child Sheet" onPress={presentChild} />
      <Button text="Present PromptSheet" onPress={presentPromptSheet} />
      <Spacer />
      <Spacer />
      <Button text="Dismiss" onPress={dismiss} />

      <TrueSheet
        ref={childSheet}
        sizes={['auto']}
        backgroundColor={DARK}
        contentContainerStyle={styles.content}
        FooterComponent={<Footer />}
      >
        <DemoContent color={DARK_BLUE} />
        <DemoContent color={DARK_BLUE} />
        <DemoContent color={DARK_BLUE} />
        <Button text="Close" onPress={() => childSheet.current?.dismiss()} />
      </TrueSheet>
    </TrueSheet>
  )
})

BasicSheet.displayName = 'BasicSheet'

const styles = StyleSheet.create({
  content: {
    padding: SPACING,
  },
})
