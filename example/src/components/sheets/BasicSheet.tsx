import { forwardRef, useRef, useState, type Ref, useImperativeHandle } from 'react'
import { StyleSheet } from 'react-native'
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet'

import { DARK, DARK_BLUE, FOOTER_HEIGHT, GRABBER_COLOR, SPACING } from '../../utils'
import { DemoContent } from '../DemoContent'
import { Footer } from '../Footer'
import { Button } from '../Button'
import { Spacer } from '../Spacer'

interface BasicSheetProps extends TrueSheetProps {}

export const BasicSheet = forwardRef((props: BasicSheetProps, ref: Ref<TrueSheet>) => {
  const sheetRef = useRef<TrueSheet>(null)
  const childSheet = useRef<TrueSheet>(null)
  const [contentCount, setContentCount] = useState(1)

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

  const addContent = () => {
    setContentCount((prev) => prev + 1)
  }

  const removeContent = () => {
    setContentCount((prev) => Math.max(1, prev - 1))
  }

  useImperativeHandle<TrueSheet | null, TrueSheet | null>(ref, () => sheetRef.current)

  return (
    <TrueSheet
      detents={['auto', 0.8, 1]}
      ref={sheetRef}
      style={styles.content}
      blurTint="dark"
      backgroundColor={DARK}
      cornerRadius={12}
      edgeToEdge
      grabberProps={{ color: GRABBER_COLOR }}
      onDragChange={(e) =>
        console.log(
          `drag changed with size of ${e.nativeEvent.value} at index: ${e.nativeEvent.index}`
        )
      }
      onDragBegin={(e) =>
        console.log(
          `drag began with size of ${e.nativeEvent.value} at index: ${e.nativeEvent.index}`
        )
      }
      onDragEnd={(e) =>
        console.log(
          `drag ended with size of ${e.nativeEvent.value} at index: ${e.nativeEvent.index}`
        )
      }
      onDismiss={() => console.log('Basic sheet dismissed!')}
      onDidPresent={(e) =>
        console.log(
          `Basic sheet presented with size of ${e.nativeEvent.value} at index: ${e.nativeEvent.index}`
        )
      }
      onDetentChange={(e) =>
        console.log(`Resized to:`, e.nativeEvent.value, 'at index:', e.nativeEvent.index)
      }
      onMount={() => {
        // sheetRef.current?.present(1)
        console.log('BasicSheet is ready!')
      }}
      footer={<Footer />}
      {...props}
    >
      {Array.from({ length: contentCount }, (_, i) => (
        <DemoContent key={i} color={DARK_BLUE} />
      ))}
      <Button text={`Add Content (${contentCount})`} onPress={addContent} />
      {contentCount > 1 && <Button text="Remove Content" onPress={removeContent} />}
      <Spacer />
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
        detents={['auto']}
        backgroundColor={DARK}
        style={styles.content}
        footer={<Footer />}
      >
        <DemoContent color={DARK_BLUE} />
        <DemoContent color={DARK_BLUE} />
        <DemoContent color={DARK_BLUE} />
        <Button text="Close" onPress={() => childSheet.current?.dismiss()} />
      </TrueSheet>
    </TrueSheet>
  )
})

const styles = StyleSheet.create({
  content: {
    padding: SPACING,
    paddingBottom: FOOTER_HEIGHT + SPACING,
  },
})

BasicSheet.displayName = 'BasicSheet'
