import React, { useRef } from 'react'
import { Button, View, type ViewStyle } from 'react-native'
import { ModalSheet } from '@lodev09/react-native-modal-sheet'

export default function App() {
  const sheet = useRef<ModalSheet>(null)

  const openSheet = async () => {
    await sheet.current?.present()
  }

  return (
    <View style={$container}>
      <ModalSheet ref={sheet} style={$box}>
        <View style={$child} />
      </ModalSheet>
      <Button title="Open Sheet" onPress={openSheet} />
    </View>
  )
}

const $box: ViewStyle = {
  height: 200,
  marginVertical: 20,
  width: 200,
  alignItems: 'center',
  justifyContent: 'center',
}

const $container: ViewStyle = {
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
}

const $child: ViewStyle = {
  height: 60,
  width: 60,
  backgroundColor: 'red',
}
