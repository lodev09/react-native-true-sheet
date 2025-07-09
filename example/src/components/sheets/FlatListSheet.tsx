import { forwardRef, type Ref } from 'react'
import { FlatList, Text, View, type ViewStyle } from 'react-native'
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet'

import { DARK, DARK_BLUE, DARK_GRAY, times } from '../../utils'
import { Input } from '../Input'
import { DemoContent } from '../DemoContent'
import { Footer } from '../Footer'

interface FlatListSheetProps extends TrueSheetProps {}

export const FlatListSheet = forwardRef((props: FlatListSheetProps, ref: Ref<TrueSheet>) => {
  return (
    <TrueSheet
      ref={ref}
      cornerRadius={12}
      sizes={['small', 'medium', 'large']}
      blurTint="dark"
      backgroundColor={DARK}
      keyboardMode="pan"
      FooterComponent={<Footer />}
      HeaderComponent={
        <View style={$header}>
          <Text>This is a header!</Text>
        </View>
      }
      edgeToEdge={true}
      onDismiss={() => console.log('Sheet FlatList dismissed!')}
      onPresent={() => console.log(`Sheet FlatList presented!`)}
      {...props}
    >
      <FlatList<number>
        data={times(10, (i) => i)}
        contentContainerStyle={$content}
        indicatorStyle="black"
        renderItem={() => (
          <View>
            <DemoContent color={DARK_GRAY} />
            <Input />
          </View>
        )}
      />
    </TrueSheet>
  )
})

FlatListSheet.displayName = 'FlatListSheet'

const $content: ViewStyle = {}

const $header: ViewStyle = {
  backgroundColor: DARK_BLUE,
}
