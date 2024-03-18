import React, { useRef } from 'react'
import { Text, TouchableHighlight, View, type TouchableHighlightProps, type ViewStyle, type TextStyle, ScrollView, type ViewProps } from 'react-native'
import { ModalSheet } from '@lodev09/react-native-modal-sheet'

import { times } from './utils'

const BUTTON_COLOR = '#3784d7'
const BLOCK_COLOR = '#cfd4dd'

interface ButtonProps extends TouchableHighlightProps {
  text: string
}

interface BlockProps extends ViewProps {

}

export default function App() {
  const sheet1 = useRef<ModalSheet>(null)
  const sheet2 = useRef<ModalSheet>(null)

  const openSheet1 = async () => {
    await sheet1.current?.present()
  }

  const openSheet2 = async () => {
    await sheet2.current?.present()
  }

  return (
    <View style={$container}>
      <View>
        <Button text='Open Sheet' onPress={openSheet1} />
        <Button text='Open ScrollView Sheet' onPress={openSheet2} />
      </View>

      <ModalSheet ref={sheet1} contentContainerStyle={$content}>
        <Block />
        <Block />
      </ModalSheet>

      <ModalSheet ref={sheet2}>
        <ScrollView
          indicatorStyle="black"
          contentContainerStyle={$content}
        >
          {times(25, (i) => (
            <Block key={i} />
          ))}
        </ScrollView>
      </ModalSheet>
    </View>
  )
}

const Button = (props: ButtonProps) => {
  const { text, ...rest } = props
  return (
    <TouchableHighlight underlayColor="#1f64ae" style={$button} {...rest}>
      <Text style={$text}>{text}</Text>
    </TouchableHighlight>
  )
}

const Block = (props: BlockProps) => {
  return <View style={$block} {...props} />
}

const $container: ViewStyle = {
  backgroundColor: 'white',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
}

const $button: ViewStyle = {
  height: 40,
  minWidth: 300,
  padding: 12,
  borderRadius: 4,
  backgroundColor: BUTTON_COLOR,
  marginBottom: 12,
  alignItems: 'center',
}

const $text: TextStyle = {
  color: 'white',
}

const $content: ViewStyle = {
  padding: 16,
}

const $block: ViewStyle = {
  height: 100,
  width: '100%',
  borderRadius: 8,
  backgroundColor: BLOCK_COLOR,
  marginBottom: 16,
}
