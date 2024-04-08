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
  TextInput,
} from 'react-native'
import { TrueSheet } from '@lodev09/react-native-true-sheet'

import { random, times } from './utils'

const SPACING = 16
const INPUT_HEIGHT = SPACING * 3
const FOOTER_HEIGHT = SPACING * 6
const BORDER_RADIUS = 4
const GRABBER_COLOR = 'rgba(121, 135, 160, 0.5)'

const DARK = '#282e37'
const GRAY = '#b2bac8'
const DARK_GRAY = '#333b48'
const LIGHT_GRAY = '#ebedf1'
const BLUE = '#3784d7'
const DARK_BLUE = '#1f64ae'

const randomTexts: string[] = [
  `Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.`,
  `Duis aute irure dolor in reprehenderit in voluptate velit esse
cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat.`,
]

interface ButtonProps extends TouchableOpacityProps {
  text: string
}

interface DemoContentProps extends ViewProps {
  radius?: number
  color?: ColorValue
  text?: string
}

export default function App() {
  const sheet1 = useRef<TrueSheet>(null)
  const sheetPrompt = useRef<TrueSheet>(null)
  const sheetScrollView = useRef<TrueSheet>(null)
  const sheetFlatList = useRef<TrueSheet>(null)

  const scrollViewRef = useRef<ScrollView>(null)
  const flatListRef = useRef<FlatList>(null)

  const presentSheet1 = async (index = 0) => {
    await sheet1.current?.present(index)
    console.log('Sheet 1 present async')
  }

  const resizeSheet1 = async (index: number) => {
    await sheet1.current?.resize(index)
    console.log(`Sheet 1 resize to ${index} async`)
  }

  const dismissSheet1 = async () => {
    await sheet1.current?.dismiss()
    console.log('Sheet 1 dismiss asynced')
  }

  return (
    <View style={$container}>
      <Button text="TrueSheet View" onPress={() => presentSheet1(0)} />
      <Button text="TrueSheet Prompt" onPress={() => sheetPrompt.current?.present()} />
      <Button text="TrueSheet ScrollView" onPress={() => sheetScrollView.current?.present()} />
      <Button text="TrueSheet FlatList" onPress={() => sheetFlatList.current?.present()} />

      <TrueSheet
        sizes={['auto', '80%', 'large']}
        ref={sheet1}
        contentContainerStyle={$content}
        blurTint="dark"
        backgroundColor={DARK}
        cornerRadius={12}
        grabberProps={{ color: GRABBER_COLOR }}
        onDismiss={() => console.log('Sheet 1 dismissed!')}
        onPresent={({ index, value }) =>
          console.log(`Sheet 1 presented with size of ${value} at index: ${index}`)
        }
        onSizeChange={({ index, value }) => console.log(`Resized to:`, value, 'at index:', index)}
        FooterComponent={<Footer />}
      >
        <DemoContent color={DARK_BLUE} text={random(randomTexts)} />
        <Button text="Present Large" onPress={() => resizeSheet1(2)} />
        <Button text="Present 80%" onPress={() => resizeSheet1(1)} />
        <Button text="Present Auto" onPress={() => resizeSheet1(0)} />
        <Button text="Dismis" onPress={dismissSheet1} />
      </TrueSheet>

      <TrueSheet
        ref={sheetPrompt}
        sizes={['auto', '80%']}
        contentContainerStyle={$content}
        blurTint="dark"
        backgroundColor={DARK}
        cornerRadius={12}
        grabberProps={{ color: GRABBER_COLOR }}
        onDismiss={() => console.log('Sheet Prompt dismissed!')}
        onPresent={({ index, value }) =>
          console.log(`Sheet Prompt presented with size of ${value} at index: ${index}`)
        }
        onSizeChange={({ index, value }) => console.log(`Resized to:`, value, 'at index:', index)}
        FooterComponent={<Footer />}
      >
        <DemoContent color={DARK_BLUE} text={random(randomTexts)} />
        <Input />
        <Button text="Dismis" onPress={() => sheetPrompt.current?.dismiss()} />
      </TrueSheet>

      <TrueSheet
        ref={sheetScrollView}
        scrollRef={scrollViewRef}
        onDismiss={() => console.log('Sheet ScrollView dismissed!')}
        onPresent={() => console.log(`Sheet ScrollView presented!`)}
        FooterComponent={<Footer />}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[$content, $scrollable]}
          indicatorStyle="black"
        >
          {times(25, (i) => (
            <DemoContent key={i} />
          ))}
        </ScrollView>
      </TrueSheet>

      <TrueSheet
        ref={sheetFlatList}
        scrollRef={flatListRef}
        sizes={['large']}
        cornerRadius={24}
        grabber={false}
        maxHeight={600}
        onDismiss={() => console.log('Sheet FlatList dismissed!')}
        onPresent={() => console.log(`Sheet FlatList presented!`)}
      >
        <FlatList<number>
          ref={flatListRef}
          data={times(50, (i) => i)}
          contentContainerStyle={$content}
          indicatorStyle="black"
          renderItem={() => <DemoContent radius={24} />}
        />
      </TrueSheet>
    </View>
  )
}

const Input = () => {
  return (
    <View style={$inputContainer}>
      <TextInput style={$input} placeholder="Enter some text..." placeholderTextColor={GRAY} />
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
  const { text, radius = BORDER_RADIUS, style: $style, color = LIGHT_GRAY, ...rest } = props
  return (
    <View
      style={[$demoContent, { backgroundColor: color, borderRadius: radius }, $style]}
      {...rest}
    >
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

const $inputContainer: ViewStyle = {
  backgroundColor: 'white',
  paddingHorizontal: SPACING,
  height: INPUT_HEIGHT,
  borderRadius: BORDER_RADIUS,
  justifyContent: 'center',
  marginBottom: SPACING * 2,
}

const $input: TextStyle = {
  fontSize: 16,
  height: SPACING * 3,
}

const $content: ViewStyle = {
  padding: SPACING,
}

const $scrollable: ViewStyle = {
  paddingBottom: FOOTER_HEIGHT + SPACING,
}

const $footer: ViewStyle = {
  height: FOOTER_HEIGHT,
  backgroundColor: DARK_GRAY,
  alignItems: 'center',
  justifyContent: 'center',
}

const $demoContent: ViewStyle = {
  height: 100,
  marginBottom: 16,
  padding: SPACING / 2,
  alignItems: 'center',
}

const $button: ViewStyle = {
  height: 40,
  padding: 12,
  borderRadius: BORDER_RADIUS,
  backgroundColor: DARK_BLUE,
  marginBottom: 12,
  alignItems: 'center',
}

const $whiteText: TextStyle = {
  color: 'white',
}

const $demoText: TextStyle = {
  fontSize: 16,
  lineHeight: 20,
  color: 'white',
}
