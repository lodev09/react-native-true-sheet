import React, { useRef } from 'react'
import { Text, View, type TextStyle, type ViewStyle } from 'react-native'
import { TrueSheet } from '@lodev09/react-native-true-sheet'
import MapView from 'react-native-maps'

import { BasicSheet, FlatListSheet, GestureSheet, PromptSheet, ScrollViewSheet } from './sheets'
import { Button, Spacer } from './components'
import { BLUE, DARK, GRAY, SPACING } from './utils'

export default function App() {
  const sheetRef = useRef<TrueSheet>(null)

  const basicSheet = useRef<TrueSheet>(null)
  const promptSheet = useRef<TrueSheet>(null)
  const scrollViewSheet = useRef<TrueSheet>(null)
  const flatListSheet = useRef<TrueSheet>(null)
  const gestureSheet = useRef<TrueSheet>(null)

  const presentBasicSheet = async (index = 0) => {
    await basicSheet.current?.present(index)
    console.log('Sheet 1 present async')
  }

  return (
    <View style={$container}>
      <MapView
        style={$map}
        initialCamera={{
          altitude: 18000,
          zoom: 14,
          center: { latitude: 9.306743705457553, longitude: 123.30474002203727 },
          pitch: 0,
          heading: 0,
        }}
        userInterfaceStyle="dark"
      />

      <TrueSheet
        sizes={['15%', 'auto', 'large']}
        ref={sheetRef}
        blurTint="dark"
        backgroundColor={DARK}
        contentContainerStyle={{ padding: SPACING, paddingBottom: SPACING * 3 }}
        dimmedIndex={2}
        dismissible={false}
        cornerRadius={12}
        initialIndex={1}
        initialIndexAnimated={false}
        onMount={() => {
          // sheetRef.current?.present(1)
          console.log('Sheet is ready!')
        }}
      >
        <View style={$heading}>
          <Text style={$title}>True Sheet 💩</Text>
          <Text style={$subtitle}>The true native bottom sheet experience.</Text>
        </View>
        <Button text="TrueSheet View" onPress={() => presentBasicSheet(0)} />
        <Button text="TrueSheet Prompt" onPress={() => promptSheet.current?.present()} />
        <Button text="TrueSheet ScrollView" onPress={() => scrollViewSheet.current?.present()} />
        <Button text="TrueSheet FlatList" onPress={() => flatListSheet.current?.present()} />
        <Button text="TrueSheet Gestures" onPress={() => gestureSheet.current?.present()} />

        <Spacer />
        <Button text="Expand" onPress={() => sheetRef.current?.resize(2)} />
        <Button text="Collapse" onPress={() => sheetRef.current?.resize(1)} />

        <BasicSheet ref={basicSheet} />
        <PromptSheet ref={promptSheet} />
        <ScrollViewSheet ref={scrollViewSheet} />
        <FlatListSheet ref={flatListSheet} />
        <GestureSheet ref={gestureSheet} />
      </TrueSheet>
    </View>
  )
}

const $container: ViewStyle = {
  backgroundColor: BLUE,
  justifyContent: 'center',
  flex: 1,
}

const $map: ViewStyle = {
  flex: 1,
}

const $heading: ViewStyle = {
  marginBottom: SPACING * 2,
}

const $title: TextStyle = {
  fontSize: 24,
  lineHeight: 30,
  fontWeight: 500,
  color: 'white',
}

const $subtitle: TextStyle = {
  lineHeight: 24,
  color: GRAY,
}
