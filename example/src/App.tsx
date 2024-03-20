import React, { useRef } from 'react'
import {
  Text,
  TouchableHighlight,
  View,
  type TouchableHighlightProps,
  type ViewStyle,
  type TextStyle,
  type ViewProps,
} from 'react-native'
import { SheetifyScrollView, SheetifyView } from '@lodev09/react-native-sheetify'

import { times } from './utils'

const BLUE = '#3784d7'
const GRAY = '#cfd4dd'

interface ButtonProps extends TouchableHighlightProps {
  text: string
}

interface DemoContentProps extends ViewProps {
  text?: string
}

export default function App() {
  const sheet1 = useRef<SheetifyView>(null)
  const sheet2 = useRef<SheetifyView>(null)

  const openSheet1 = async () => {
    await sheet1.current?.present()
    // console.log('sheet 1 presented!')
  }

  const openSheet2 = async () => {
    await sheet2.current?.present()
    // console.log('sheet 2 presented!')
  }

  return (
    <View style={$container}>
      <View>
        <Button text="Sheetify View" onPress={openSheet1} />
        <Button text="Sheetify ScrollView" onPress={openSheet2} />
      </View>

      <SheetifyView ref={sheet1} style={$content} backgroundColor={BLUE}>
        <DemoContent />
        <DemoContent />
        <DemoContent />
      </SheetifyView>

      <SheetifyView ref={sheet2}>
        <SheetifyScrollView contentContainerStyle={$content} indicatorStyle="black">
          {times(25, (i) => (
            <DemoContent key={i} text={String(i)} />
          ))}
        </SheetifyScrollView>
      </SheetifyView>
    </View>
  )
}

const Button = (props: ButtonProps) => {
  const { text, ...rest } = props
  return (
    <TouchableHighlight underlayColor="#1f64ae" style={$button} {...rest}>
      <Text style={$buttonText}>{text}</Text>
    </TouchableHighlight>
  )
}

const DemoContent = (props: DemoContentProps) => {
  const { text, style: $style, ...rest } = props
  return (
    <View style={[$demoContent, $style]} {...rest}>
      {text && <Text style={$demoText}>{text}</Text>}
    </View>
  )
}

const $container: ViewStyle = {
  backgroundColor: 'white',
  justifyContent: 'center',
  padding: 24,
  flex: 1,
}

// const $header: ViewStyle = {
//   height: 64,
//   marginBottom: 0,
//   backgroundColor: BLUE,
//   borderRadius: 0,
// }

const $content: ViewStyle = {
  padding: 16,
}

const $demoContent: ViewStyle = {
  height: 100,
  borderRadius: 4,
  backgroundColor: GRAY,
  marginBottom: 16,
  alignItems: 'center',
  justifyContent: 'center',
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

const $buttonText: TextStyle = {
  color: 'white',
}

const $demoText: TextStyle = {
  fontSize: 32,
  fontWeight: '500',
  opacity: 0.25,
}
