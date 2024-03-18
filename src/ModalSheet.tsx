import React, { PureComponent, Component, type RefObject, createRef, type ReactNode } from 'react'
import { StyleSheet, requireNativeComponent, Platform, findNodeHandle, type NativeMethods, View, type ViewStyle, type StyleProp } from 'react-native'

import type { ModalSheetViewProps } from './types'
import { ModalSheetModule } from './ModalSheetModule'

const LINKING_ERROR =
  `The package 'react-native-modal-sheet' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n'

interface NativeModalSheetViewProps {
  style: StyleProp<ViewStyle>
  children?: ReactNode
}

type RefType = Component<NativeModalSheetViewProps> & Readonly<NativeMethods>

const ComponentName = 'ModalSheetView'

const NativeModalSheetView = requireNativeComponent<NativeModalSheetViewProps>(ComponentName)
if (!NativeModalSheetView) {
  throw new Error(LINKING_ERROR)
}

export class ModalSheet extends PureComponent<ModalSheetViewProps> {
  displayName = 'ModalSheet'

  private readonly ref: RefObject<RefType>

  /** @internal */
  constructor(props: ModalSheetViewProps) {
    super(props)
    this.ref = createRef<RefType>()
  }

  private get handle(): number {
    const nodeHandle = findNodeHandle(this.ref.current)
    if (nodeHandle == null || nodeHandle === -1) {
      throw new Error(`Could not get native view tag`)
    }

    return nodeHandle
  }

  /**
   * Present the modal sheet
   */
  public async present() {
    await ModalSheetModule.present(this.handle)
  }

  render(): ReactNode {
    return (
      <NativeModalSheetView
        style={$nativeView}
        ref={this.ref}
      >
        <View style={[$wrapper, this.props.style]}>
          <View style={this.props.contentContainerStyle}>
            {this.props.children}
          </View>
        </View>
      </NativeModalSheetView>
    )
  }
}

const $nativeView: ViewStyle = {
  ...StyleSheet.absoluteFillObject,
  zIndex: -1000,
}

const $wrapper: ViewStyle = {
  backgroundColor: 'white',
}
