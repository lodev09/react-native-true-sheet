import React, { useRef } from 'react'
import {
  Text,
  TouchableHighlight,
  View,
  type TouchableHighlightProps,
  type ViewStyle,
  type TextStyle,
  ScrollView,
  type ViewProps,
} from 'react-native'
import { SheetifyView } from '@lodev09/react-native-sheetify'

import { times } from './utils'

const BLUE = '#3784d7'
const GRAY = '#cfd4dd'

interface ButtonProps extends TouchableHighlightProps {
  text: string
}

interface BlockProps extends ViewProps {}

export default function App() {
  const sheet1 = useRef<SheetifyView>(null)
  const sheet2 = useRef<SheetifyView>(null)

  const openSheet1 = async () => {
    await sheet1.current?.present()
  }

  const openSheet2 = async () => {
    await sheet2.current?.present()
  }

  return (
    <View style={$container}>
      <View>
        <Button text="Open Sheet" onPress={openSheet1} />
        <Button text="Open ScrollView Sheet" onPress={openSheet2} />
      </View>

      <SheetifyView ref={sheet1} style={$content} backgroundColor={BLUE}>
        <DemoContent />
        <DemoContent />
      </SheetifyView>

      <SheetifyView ref={sheet2}>
        <ScrollView indicatorStyle="black" contentContainerStyle={$content}>
          {times(25, (i) => (
            <DemoContent key={i} />
          ))}
        </ScrollView>
      </SheetifyView>
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

const DemoContent = (props: BlockProps) => {
  return <View style={$demoContent} {...props} />
}

const $container: ViewStyle = {
  backgroundColor: 'white',
  justifyContent: 'center',
  padding: 24,
  flex: 1,
}

const $content: ViewStyle = {
  padding: 16,
}

const $demoContent: ViewStyle = {
  height: 100,
  borderRadius: 8,
  backgroundColor: GRAY,
  marginBottom: 16,
}

const $button: ViewStyle = {
  height: 40,
  minWidth: 300,
  padding: 12,
  borderRadius: 4,
  backgroundColor: BLUE,
  marginBottom: 12,
  alignItems: 'center',
}

const $text: TextStyle = {
  color: 'white',
}
