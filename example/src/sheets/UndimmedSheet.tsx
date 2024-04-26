import React, { forwardRef, useRef, type Ref, useImperativeHandle, useState } from 'react'
import { type ViewStyle, StyleSheet, View } from 'react-native'
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet'

import { Button, DemoContent, Spacer } from '../components'
import { BLUE, DARK, SPACING } from '../utils'

interface UndimmedSheetProps extends TrueSheetProps {}

interface UndimmedSheetRef {
  present: () => void
}

export const UndimmedSheet = forwardRef((props: UndimmedSheetProps, ref: Ref<UndimmedSheetRef>) => {
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
          <Button text="Some Button" onPress={() => sheetRef.current?.resize(2)} />
          <Button text="Another Button" onPress={() => sheetRef.current?.resize(1)} />
          <Spacer />
          <Button text="Do Not Press Me" onPress={() => sheetRef.current?.dismiss()} />
        </View>
      )}
      <TrueSheet
        ref={sheetRef}
        // dimmed={false}
        dimmedIndex={1}
        sizes={['auto', '69%', 'large']}
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

UndimmedSheet.displayName = 'UndimmedSheet'

const $content: ViewStyle = {
  padding: SPACING,
  paddingBottom: SPACING * 3,
}

const $backgroundContent: ViewStyle = {
  backgroundColor: BLUE,
  justifyContent: 'center',
  padding: 24,
  flex: 1,
}
