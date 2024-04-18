import React, { forwardRef, useRef, type Ref } from 'react'
import { ScrollView, type ViewStyle } from 'react-native'
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet'

import { FOOTER_HEIGHT, SPACING, times } from '../utils'
import { DemoContent, Footer } from '../components'

interface ScrollViewSheetProps extends TrueSheetProps {}

export const ScrollViewSheet = forwardRef((props: ScrollViewSheetProps, ref: Ref<TrueSheet>) => {
  const scrollViewRef = useRef<ScrollView>(null)

  return (
    <TrueSheet
      ref={ref}
      scrollRef={scrollViewRef}
      onDismiss={() => console.log('Sheet ScrollView dismissed!')}
      onPresent={() => console.log(`Sheet ScrollView presented!`)}
      FooterComponent={<Footer />}
      {...props}
    >
      <ScrollView
        nestedScrollEnabled
        ref={scrollViewRef}
        contentContainerStyle={$content}
        indicatorStyle="black"
      >
        {times(25, (i) => (
          <DemoContent key={i} />
        ))}
      </ScrollView>
    </TrueSheet>
  )
})

ScrollViewSheet.displayName = 'ScrollViewSheet'

const $content: ViewStyle = {
  padding: SPACING,
  paddingBottom: FOOTER_HEIGHT + SPACING,
}
