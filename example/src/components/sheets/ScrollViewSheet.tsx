import { forwardRef, type Ref } from 'react'
import { StyleSheet, ScrollView } from 'react-native'
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet'

import { FOOTER_HEIGHT, SPACING, times } from '../../utils'
import { Footer } from '../Footer'
import { DemoContent } from '../DemoContent'

interface ScrollViewSheetProps extends TrueSheetProps {}

export const ScrollViewSheet = forwardRef((props: ScrollViewSheetProps, ref: Ref<TrueSheet>) => {
  return (
    <TrueSheet
      ref={ref}
      detents={[0.8]}
      cornerRadius={12}
      onDismiss={() => console.log('Sheet ScrollView dismissed!')}
      onPresent={() => console.log(`Sheet ScrollView presented!`)}
      footer={<Footer />}
      edgeToEdge
      {...props}
    >
      <ScrollView nestedScrollEnabled style={styles.content} indicatorStyle="black">
        {times(25, (i) => (
          <DemoContent key={i} />
        ))}
      </ScrollView>
    </TrueSheet>
  )
})

ScrollViewSheet.displayName = 'ScrollViewSheet'

const styles = StyleSheet.create({
  content: {
    padding: SPACING,
    paddingBottom: FOOTER_HEIGHT + SPACING,
  },
})
