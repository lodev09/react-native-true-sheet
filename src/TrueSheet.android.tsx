import React, { Component, PureComponent, createRef, type ReactNode, type RefObject } from 'react'
import { requireNativeComponent, Platform, type NativeMethods, View } from 'react-native'
import type { TrueSheetProps } from './types'

const LINKING_ERROR =
  `The package '@lodev09/react-native-true-sheet' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n'

const ComponentName = 'TrueSheetView'

interface TrueSheetNativeViewProps {
  sizes: TrueSheetProps['sizes']
  children: ReactNode
}

const TrueSheetNativeView = requireNativeComponent<TrueSheetNativeViewProps>(ComponentName)

if (!TrueSheetNativeView) {
  throw new Error(LINKING_ERROR)
}

type NativeRef = Component<TrueSheetNativeViewProps> & Readonly<NativeMethods>

export class TrueSheet extends PureComponent<TrueSheetProps> {
  displayName = 'TrueSheet'

  private readonly ref: RefObject<NativeRef>

  constructor(props: TrueSheetProps) {
    super(props)

    this.ref = createRef<NativeRef>()
  }

  render(): ReactNode {
    return (
      <TrueSheetNativeView ref={this.ref} sizes={this.props.sizes ?? ['medium', 'large']}>
        <View style={{ backgroundColor: this.props.backgroundColor ?? 'white' }}>
          <View style={this.props.style}>{this.props.children}</View>
        </View>
      </TrueSheetNativeView>
    )
  }
}
