import React, { useRef } from 'react'
import { View, type ViewStyle } from 'react-native'
import { TrueSheet } from '@lodev09/react-native-true-sheet'

import {
  BasicSheet,
  FlatListSheet,
  GestureSheet,
  InlineSheet,
  PromptSheet,
  ScrollViewSheet,
} from './sheets'
import { Button } from './components'
import { BLUE } from './utils'

export default function App() {
  const basicSheet = useRef<TrueSheet>(null)
  const promptSheet = useRef<TrueSheet>(null)
  const scrollViewSheet = useRef<TrueSheet>(null)
  const flatListSheet = useRef<TrueSheet>(null)
  const gestureSheet = useRef<TrueSheet>(null)
  const inlineSheet = useRef<TrueSheet>(null)

  const presentBasicSheet = async (index = 0) => {
    await basicSheet.current?.present(index)
    console.log('Sheet 1 present async')
  }

  return (
    <View style={$container}>
      <Button text="TrueSheet View" onPress={() => presentBasicSheet(0)} />
      <Button text="TrueSheet Prompt" onPress={() => promptSheet.current?.present()} />
      <Button text="TrueSheet ScrollView" onPress={() => scrollViewSheet.current?.present()} />
      <Button text="TrueSheet FlatList" onPress={() => flatListSheet.current?.present()} />
      <Button text="TrueSheet Gestures" onPress={() => gestureSheet.current?.present()} />
      <Button text="TrueSheet Inline" onPress={() => inlineSheet.current?.present()} />

      <BasicSheet ref={basicSheet} />
      <PromptSheet ref={promptSheet} />
      <ScrollViewSheet ref={scrollViewSheet} />
      <FlatListSheet ref={flatListSheet} />
      <GestureSheet ref={gestureSheet} />
      <InlineSheet ref={inlineSheet} />
    </View>
  )
}

const $container: ViewStyle = {
  backgroundColor: BLUE,
  justifyContent: 'center',
  padding: 24,
  flex: 1,
}
