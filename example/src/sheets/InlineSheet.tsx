import React, { forwardRef, useRef, type Ref, useImperativeHandle, useState } from 'react'
import { type ViewStyle, StyleSheet, View, Text, type TextStyle } from 'react-native'
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet'

import { Button, DemoContent, Spacer } from '../components'
import { BLUE, DARK, SPACING } from '../utils'

interface InlineSheetProps extends TrueSheetProps {}

interface InlineSheetRef {
  present: () => void
}

export const InlineSheet = forwardRef((props: InlineSheetProps, ref: Ref<InlineSheetRef>) => {
  const sheetRef = useRef<TrueSheet>(null)

  const [isPresented, setIsPresented] = useState(false)

  const dismiss = () => {
    sheetRef.current?.dismiss()
  }

  useImperativeHandle(ref, () => ({
    present: () => {
      setIsPresented(true)
      sheetRef.current?.present()
    },
  }))

  return (
    <>
      {isPresented && (
        <View style={[$backgroundContent, StyleSheet.absoluteFillObject]}>
          <Text style={$text} selectable>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
            dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
            mollit anim id est laborum.
          </Text>
          <Spacer />
          <Button text="Some Button" onPress={() => sheetRef.current?.resize(1)} />
          <Button text="Do Not Press Me" onPress={() => sheetRef.current?.dismiss()} />
        </View>
      )}
      <TrueSheet
        ref={sheetRef}
        // dimmed={false}
        // dimmedIndex={1}
        sizes={['auto', '75%', 'large']}
        blurTint="dark"
        backgroundColor={DARK}
        onDismiss={() => setIsPresented(false)}
        contentContainerStyle={$content}
        {...props}
      >
        <DemoContent color={BLUE} />
        <DemoContent color={BLUE} />
        <Button text="Dismiss" onPress={dismiss} />
      </TrueSheet>
    </>
  )
})

InlineSheet.displayName = 'InlineSheet'

const $content: ViewStyle = {
  padding: SPACING,
  paddingBottom: SPACING * 3,
}

const $backgroundContent: ViewStyle = {
  padding: 24,
  paddingTop: SPACING * 6,
  backgroundColor: BLUE,
}

const $text: TextStyle = {
  color: 'white',
  fontSize: 18,
}
