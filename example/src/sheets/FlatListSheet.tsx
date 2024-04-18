import React, { forwardRef, useRef, type Ref } from 'react'
import { FlatList, type ViewStyle } from 'react-native'
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet'

import { SPACING, times } from '../utils'
import { DemoContent } from '../components'

interface FlatListSheetProps extends TrueSheetProps {}

export const FlatListSheet = forwardRef((props: FlatListSheetProps, ref: Ref<TrueSheet>) => {
  const flatListRef = useRef<FlatList>(null)

  return (
    <TrueSheet
      ref={ref}
      scrollRef={flatListRef}
      sizes={['large']}
      cornerRadius={24}
      grabber={false}
      maxHeight={600}
      onDismiss={() => console.log('Sheet FlatList dismissed!')}
      onPresent={() => console.log(`Sheet FlatList presented!`)}
      {...props}
    >
      <FlatList<number>
        ref={flatListRef}
        nestedScrollEnabled
        data={times(50, (i) => i)}
        contentContainerStyle={$content}
        indicatorStyle="black"
        renderItem={() => <DemoContent radius={24} />}
      />
    </TrueSheet>
  )
})

FlatListSheet.displayName = 'FlatListSheet'

const $content: ViewStyle = {
  padding: SPACING,
}
