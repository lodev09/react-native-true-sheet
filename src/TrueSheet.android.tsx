import React, { Component, PureComponent, createRef, type ReactNode, type RefObject } from 'react'
import {
  requireNativeComponent,
  Platform,
  type NativeMethods,
  View,
  findNodeHandle,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import type { TrueSheetProps } from './types'
import { TrueSheetModule } from './TrueSheetModule'

const LINKING_ERROR =
  `The package '@lodev09/react-native-true-sheet' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n'

const ComponentName = 'TrueSheetView'

interface TrueSheetNativeViewProps {
  style: StyleProp<ViewStyle>
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

  private get handle(): number {
    const nodeHandle = findNodeHandle(this.ref.current)
    if (nodeHandle == null || nodeHandle === -1) {
      throw new Error(`Could not get native view tag`)
    }

    return nodeHandle
  }

  /**
   * Present the modal sheet at size index.
   * See `sizes` prop
   */
  public async present(index: number = 0) {
    await TrueSheetModule.present(this.handle, index)
  }

  public async dismiss() {
    await TrueSheetModule.dismiss(this.handle)
  }

  render(): ReactNode {
    return (
      <TrueSheetNativeView
        style={$nativeSheet}
        ref={this.ref}
        sizes={this.props.sizes ?? ['medium', 'large']}
      >
        <View
          collapsable={false}
          style={{ backgroundColor: this.props.backgroundColor ?? 'white' }}
        >
          <View style={this.props.style}>{this.props.children}</View>
        </View>
      </TrueSheetNativeView>
    )
  }
}

const $nativeSheet: ViewStyle = {
  position: 'absolute',
  zIndex: -99999,
}
