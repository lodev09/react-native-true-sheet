import React, { forwardRef, useEffect, useRef, useImperativeHandle, type Ref } from 'react'
import { ScrollView, type ScrollViewProps, findNodeHandle } from 'react-native'

import { SheetifyModule } from '../SheetifyModule'

/**
 * Extended `ScrollView` Component to let Sheetify handle scrollview properly.
 * Works well with `SheetifyHeader` and `SheetifyFooter`
 */
export const SheetifyScrollView = forwardRef((props: ScrollViewProps, ref: Ref<ScrollView>) => {
  const scrollViewRef = useRef<ScrollView>(null)

  useEffect(() => {
    const nodeHandle = findNodeHandle(scrollViewRef.current)
    SheetifyModule.setScrollHandle(nodeHandle)
  }, [])

  useImperativeHandle<ScrollView | null, ScrollView | null>(ref, () => scrollViewRef.current)

  return <ScrollView ref={scrollViewRef} {...props} />
})

SheetifyScrollView.displayName = 'SheetifyScrollView'
