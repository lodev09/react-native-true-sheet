import { useRef } from 'react'
import { View, type ViewStyle } from 'react-native'
import type { TrueSheet } from '@lodev09/react-native-true-sheet'

import { BLUE, SPACING } from '../utils'
import { Button } from '../components'
import { BasicSheet, PromptSheet, ScrollViewSheet } from '../components/sheets'

export const ChildScreen = () => {
  const basicSheet = useRef<TrueSheet>(null)
  const promptSheet = useRef<TrueSheet>(null)
  const scrollViewSheet = useRef<TrueSheet>(null)

  return (
    <View style={$container}>
      <Button text="TrueSheet View" onPress={() => basicSheet.current?.present()} />
      <Button text="TrueSheet Prompt" onPress={() => promptSheet.current?.present()} />
      <Button text="TrueSheet ScrollView" onPress={() => scrollViewSheet.current?.present()} />

      <BasicSheet ref={basicSheet} />
      <PromptSheet ref={promptSheet} />
      <ScrollViewSheet ref={scrollViewSheet} />
    </View>
  )
}

const $container: ViewStyle = {
  backgroundColor: BLUE,
  justifyContent: 'center',
  flex: 1,
  padding: SPACING,
}
