import React, { PureComponent, Component, type RefObject, createRef, type ReactNode } from 'react'
import {
  requireNativeComponent,
  Platform,
  findNodeHandle,
  View,
  type NativeMethods,
  type ViewStyle,
  type NativeSyntheticEvent,
} from 'react-native'

import type { TrueSheetProps, SizeChangeEvent } from './types'
import { TrueSheetModule } from './TrueSheetModule'

const LINKING_ERROR =
  `The package '@lodev09/react-native-true-sheet' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n'

const ComponentName = 'TrueSheetView'

interface TrueSheetNativeViewProps extends Omit<TrueSheetProps, 'onPresent' | 'onSizeChange'> {
  scrollableHandle: number | null
  onPresent: (event: NativeSyntheticEvent<{ index: number }>) => void
  onSizeChange: (event: NativeSyntheticEvent<SizeChangeEvent>) => void
}

const TrueSheetNativeView = requireNativeComponent<TrueSheetNativeViewProps>(ComponentName)

if (!TrueSheetNativeView) {
  throw new Error(LINKING_ERROR)
}

type NativeRef = Component<TrueSheetNativeViewProps> & Readonly<NativeMethods>

interface TrueSheetState {
  scrollableHandle: number | null
}

export class TrueSheet extends PureComponent<TrueSheetProps, TrueSheetState> {
  displayName = 'TrueSheet'

  private readonly ref: RefObject<NativeRef>

  constructor(props: TrueSheetProps) {
    super(props)

    this.ref = createRef<NativeRef>()

    this.onDismiss = this.onDismiss.bind(this)
    this.onPresent = this.onPresent.bind(this)
    this.onSizeChange = this.onSizeChange.bind(this)

    this.state = {
      scrollableHandle: null,
    }
  }

  private get handle(): number {
    const nodeHandle = findNodeHandle(this.ref.current)
    if (nodeHandle == null || nodeHandle === -1) {
      throw new Error(`Could not get native view tag`)
    }

    return nodeHandle
  }

  private updateState() {
    const scrollableHandle = this.props.scrollRef?.current
      ? findNodeHandle(this.props.scrollRef.current)
      : null

    this.setState({
      scrollableHandle,
    })
  }

  private onSizeChange(event: NativeSyntheticEvent<SizeChangeEvent>) {
    this.props.onSizeChange?.(event.nativeEvent)
  }

  private onPresent(): void {
    this.props.onPresent?.()
  }

  private onDismiss(): void {
    this.props.onDismiss?.()
  }

  componentDidMount(): void {
    if (this.props.sizes && this.props.sizes.length > 3) {
      console.warn(
        'TrueSheet only supports a maximum of 3 sizes; collapsed, half-expanded and expanded. Check your `sizes` prop.'
      )
    }

    this.updateState()
  }

  componentDidUpdate(): void {
    this.updateState()
  }

  /**
   * Present the modal sheet at size index.
   * See `sizes` prop
   */
  public async present(index: number = 0) {
    await TrueSheetModule.present(this.handle, index)
  }

  /**
   * Dismiss the Sheet
   */
  public async dismiss() {
    await TrueSheetModule.dismiss(this.handle)
  }

  render(): ReactNode {
    const FooterComponent = this.props.FooterComponent

    return (
      <TrueSheetNativeView
        ref={this.ref}
        style={$nativeSheet}
        scrollableHandle={this.state.scrollableHandle}
        sizes={this.props.sizes ?? ['medium', 'large']}
        blurStyle={this.props.blurStyle ?? 'light'}
        cornerRadius={this.props.cornerRadius}
        maxHeight={this.props.maxHeight}
        onPresent={this.onPresent}
        onDismiss={this.onDismiss}
        onSizeChange={this.onSizeChange}
      >
        <View collapsable={false} style={{ backgroundColor: this.props.backgroundColor }}>
          <View collapsable={false} style={this.props.style}>
            {this.props.children}
          </View>
          <View collapsable={false}>{!!FooterComponent && <FooterComponent />}</View>
        </View>
      </TrueSheetNativeView>
    )
  }
}

const $nativeSheet: ViewStyle = {
  position: 'absolute',
  width: 0,
  zIndex: -9999,
}
