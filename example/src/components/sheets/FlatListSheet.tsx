import { forwardRef, type Ref } from 'react'
import { StyleSheet, FlatList, View } from 'react-native'
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet'

import { DARK, DARK_GRAY, INPUT_HEIGHT, SPACING, times } from '../../utils'
import { Input } from '../Input'
import { DemoContent } from '../DemoContent'

interface FlatListSheetProps extends TrueSheetProps {}

export const FlatListSheet = forwardRef((props: FlatListSheetProps, ref: Ref<TrueSheet>) => {
  return (
    <TrueSheet
      ref={ref}
      cornerRadius={12}
      detents={[0.5, 1]}
      blurTint="dark"
      backgroundColor={DARK}
      keyboardMode="pan"
      edgeToEdge
      onDismiss={() => console.log('Sheet FlatList dismissed!')}
      onDidPresent={() => console.log(`Sheet FlatList presented!`)}
      {...props}
    >
      <View style={styles.header}>
        <Input />
      </View>
      <FlatList
        nestedScrollEnabled
        data={times(50, (i) => i)}
        contentContainerStyle={styles.content}
        indicatorStyle="black"
        renderItem={() => <DemoContent color={DARK_GRAY} />}
      />
    </TrueSheet>
  )
})

FlatListSheet.displayName = 'FlatListSheet'

const styles = StyleSheet.create({
  content: {
    padding: SPACING,
    paddingTop: INPUT_HEIGHT + SPACING * 4,
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: DARK,
    paddingTop: SPACING * 2,
    paddingHorizontal: SPACING,
    zIndex: 1,
  },
})
