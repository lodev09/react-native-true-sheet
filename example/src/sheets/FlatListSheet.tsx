import React, { forwardRef, useRef, type Ref } from 'react'
import { FlatList, View, type ViewStyle } from 'react-native'
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet'

import { DARK, INPUT_HEIGHT, SPACING, times } from '../utils'
import { DemoContent, Input } from '../components'

interface FlatListSheetProps extends TrueSheetProps {}

export const FlatListSheet = forwardRef((props: FlatListSheetProps, ref: Ref<TrueSheet>) => {
  const flatListRef = useRef<FlatList>(null)

  return (
    <TrueSheet
      ref={ref}
      scrollRef={flatListRef}
      sizes={['small', 'medium', 'large']}
      blurTint="dark"
      backgroundColor={DARK}
      cornerRadius={24}
      onDismiss={() => console.log('Sheet FlatList dismissed!')}
      onPresent={() => console.log(`Sheet FlatList presented!`)}
      {...props}
    >
      <View style={$header}>
        <Input />
      </View>
      <FlatList<number>
        ref={flatListRef}
        nestedScrollEnabled
        data={times(50, (i) => i)}
        contentContainerStyle={$content}
        indicatorStyle="black"
        renderItem={() => <DemoContent />}
      />
    </TrueSheet>
  )
})

FlatListSheet.displayName = 'FlatListSheet'

const $content: ViewStyle = {
  padding: SPACING,
  paddingTop: INPUT_HEIGHT + SPACING * 4,
}

const $header: ViewStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  backgroundColor: DARK,
  paddingTop: SPACING * 2,
  paddingHorizontal: SPACING,
  zIndex: 1,
}
