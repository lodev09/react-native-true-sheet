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
  type ColorValue,
} from 'react-native'
import { TrueSheet } from '@lodev09/react-native-true-sheet'

import { times } from './utils'

const CONTENT_PADDING = 16
const FOOTER_HEIGHT = 80

const DARK = '#282e37'
const DARK_GRAY = '#333b48'
const LIGHT_GRAY = '#ebedf1'
const BLUE = '#3784d7'
const BLUE_DARK = '#1f64ae'

interface ButtonProps extends TouchableOpacityProps {
  text: string
}

interface DemoContentProps extends ViewProps {
  color?: ColorValue
  text?: string
}

export default function App() {
  const sheet1 = useRef<TrueSheet>(null)
  const sheet2 = useRef<TrueSheet>(null)
  const sheet3 = useRef<TrueSheet>(null)

  const scrollViewRef = useRef<ScrollView>(null)
  const flatListRef = useRef<FlatList>(null)

  const presentSheet1 = (index = 0) => {
    sheet1.current?.present(index)
  }

  return (
    <View style={$container}>
      <Button text="TrueSheet View" onPress={() => presentSheet1(0)} />
      <Button text="TrueSheet ScrollView" onPress={() => sheet2.current?.present()} />
      <Button text="TrueSheet FlatList" onPress={() => sheet3.current?.present()} />
      <TrueSheet
        sizes={['auto', '80%', 'large']}
        ref={sheet1}
        style={$content}
        backgroundColor={DARK}
        onDismiss={() => console.log('Sheet 1 dismissed!')}
        onPresent={() => console.log(`Sheet 1 presented!`)}
        onSizeChange={({ index, value }) => console.log(`Resized to:`, value, 'at index:', index)}
        FooterComponent={() => (
          <>
            <Footer />
            <Footer />
            <Footer />
          </>
        )}
      >
        <DemoContent color={DARK_GRAY} />
        <DemoContent color={DARK_GRAY} />
        <Button text="Present Large" onPress={() => presentSheet1(2)} />
        <Button text="Present 80%" onPress={() => presentSheet1(1)} />
        <Button text="Present Auto" onPress={() => presentSheet1(0)} />
        <Button text="Dismis" onPress={() => sheet1.current?.dismiss()} />
      </TrueSheet>

      <TrueSheet
        ref={sheet2}
        scrollRef={scrollViewRef}
        onDismiss={() => console.log('Sheet 2 dismissed!')}
        onPresent={() => console.log(`Sheet 2 presented!`)}
        FooterComponent={Footer}
      >
        <ScrollView ref={scrollViewRef} contentContainerStyle={$content} indicatorStyle="black">
          {times(25, (i) => (
            <DemoContent key={i} text={String(i + 1)} />
          ))}
        </ScrollView>
      </TrueSheet>

      <TrueSheet
        ref={sheet3}
        scrollRef={flatListRef}
        sizes={['large']}
        onDismiss={() => console.log('Sheet 3 dismissed!')}
        onPresent={() => console.log(`Sheet 3 presented!`)}
      >
        <FlatList<number>
          ref={flatListRef}
          data={times(50, (i) => i)}
          contentContainerStyle={$content}
          indicatorStyle="black"
          renderItem={({ item }) => <DemoContent text={String(item + 1)} />}
        />
      </TrueSheet>
    </View>
  )
}

const Footer = () => {
  return (
    <View style={$footer}>
      <Text style={$whiteText}>FOOTER</Text>
    </View>
  )
}

const Button = (props: ButtonProps) => {
  const { text, ...rest } = props
  return (
    <TouchableOpacity activeOpacity={0.6} style={$button} {...rest}>
      <Text style={$whiteText}>{text}</Text>
    </TouchableOpacity>
  )
}

const DemoContent = (props: DemoContentProps) => {
  const { text, style: $style, color = LIGHT_GRAY, ...rest } = props
  return (
    <View style={[$demoContent, { backgroundColor: color }, $style]} {...rest}>
      {text && <Text style={$demoText}>{text}</Text>}
    </View>
  )
}

const $container: ViewStyle = {
  backgroundColor: BLUE,
  justifyContent: 'center',
  padding: 24,
  flex: 1,
}

const $content: ViewStyle = {
  padding: CONTENT_PADDING,
}

const $footer: ViewStyle = {
  height: FOOTER_HEIGHT,
  backgroundColor: DARK_GRAY,
  alignItems: 'center',
  justifyContent: 'center',
}

const $demoContent: ViewStyle = {
  height: 100,
  borderRadius: 4,
  marginBottom: 16,
  alignItems: 'center',
  justifyContent: 'center',
}

const $button: ViewStyle = {
  height: 40,
  padding: 12,
  borderRadius: 4,
  backgroundColor: BLUE_DARK,
  marginBottom: 12,
  alignItems: 'center',
}

const $whiteText: TextStyle = {
  color: 'white',
}

const $demoText: TextStyle = {
  fontSize: 32,
  fontWeight: '500',
  opacity: 0.25,
}
