import React, { useRef } from 'react'
import {
  Text,
  TouchableOpacity,
  View,
  type TouchableOpacityProps,
  type ViewStyle,
  type TextStyle,
  type ViewProps,
  ScrollView,
  FlatList,
} from 'react-native'
import { SheetifyView } from '@lodev09/react-native-sheetify'

import { times } from './utils'

const CONTENT_PADDING = 16
const FOOTER_HEIGHT = 64

const DARK = '#282e37'
const GREEN = '#27be78'
const BLUE = '#3784d7'
const BLUE_DARK = '#1f64ae'
const GRAY = '#cfd4dd'

interface ButtonProps extends TouchableOpacityProps {
  text: string
}

interface DemoContentProps extends ViewProps {
  text?: string
}

export default function App() {
  const sheet1 = useRef<SheetifyView>(null)
  const sheet2 = useRef<SheetifyView>(null)
  const sheet3 = useRef<SheetifyView>(null)

  const scrollViewRef = useRef<ScrollView>(null)
  const flatListRef = useRef<FlatList>(null)

  const openSheet1 = async () => {
    await sheet1.current?.present()
    console.log('SHEET 1: presented!')
  }

  const openSheet2 = async () => {
    await sheet2.current?.present()
    console.log('SHEET 2: presented!')
  }

  const openSheet3 = async () => {
    await sheet3.current?.present()
    console.log('SHEET 3: presented!')
  }

  return (
    <View style={$container}>
      <Button text="Sheetify View" onPress={openSheet1} />
      <Button text="Sheetify ScrollView" onPress={openSheet2} />
      <Button text="Sheetify FlatList" onPress={openSheet3} />
      <SheetifyView
        sizes={['auto', '70%', 'large']}
        ref={sheet1}
        style={$content}
        backgroundColor={DARK}
        FooterComponent={() => <View style={$footer} />}
      >
        <DemoContent />
        <DemoContent />
      </SheetifyView>

      <SheetifyView
        ref={sheet2}
        scrollRef={scrollViewRef}
        FooterComponent={() => <View style={$footer} />}
      >
        <ScrollView ref={scrollViewRef} contentContainerStyle={$content} indicatorStyle="black">
          {times(25, (i) => (
            <DemoContent key={i} text={String(i + 1)} />
          ))}
        </ScrollView>
      </SheetifyView>

      <SheetifyView ref={sheet3} scrollRef={flatListRef} sizes={['large']}>
        <FlatList<number>
          ref={flatListRef}
          data={times(50, (i) => i)}
          contentContainerStyle={$content}
          indicatorStyle="black"
          renderItem={({ item }) => <DemoContent text={String(item + 1)} />}
        />
      </SheetifyView>
    </View>
  )
}

const Button = (props: ButtonProps) => {
  const { text, ...rest } = props
  return (
    <TouchableOpacity activeOpacity={0.6} style={$button} {...rest}>
      <Text style={$buttonText}>{text}</Text>
    </TouchableOpacity>
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
  backgroundColor: BLUE,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 24,
  flex: 1,
}

const $content: ViewStyle = {
  padding: CONTENT_PADDING,
}

const $footer: ViewStyle = {
  height: FOOTER_HEIGHT,
  backgroundColor: GREEN,
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
  width: 300,
  padding: 12,
  borderRadius: 4,
  backgroundColor: BLUE_DARK,
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
