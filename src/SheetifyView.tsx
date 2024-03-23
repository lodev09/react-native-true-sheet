import React, { PureComponent, Component, type RefObject, createRef, type ReactNode } from 'react'
import {
  requireNativeComponent,
  Platform,
  findNodeHandle,
  type NativeMethods,
  type ViewStyle,
  View,
  type ViewProps,
  type NativeSyntheticEvent,
  type StyleProp,
  type ColorValue,
} from 'react-native'

import type { SheetifyViewProps, SizeChangeEvent } from './types'
import { SheetifyModule } from './SheetifyModule'

const LINKING_ERROR =
  `The package 'react-native-sheetify' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n'

const ComponentName = 'SheetifyView'

interface SheetifyNativeViewProps {
  scrollableHandle: number | null
  footerHandle: number | null
  onDismiss: () => void
  onPresent: (event: NativeSyntheticEvent<{ index: number }>) => void
  onSizeChange: (event: NativeSyntheticEvent<SizeChangeEvent>) => void
  children: ReactNode
  backgroundColor?: ColorValue
  style: StyleProp<ViewStyle>
  sizes: SheetifyViewProps['sizes']
}

const SheetifyNativeView = requireNativeComponent<SheetifyNativeViewProps>(ComponentName)

if (!SheetifyNativeView) {
  throw new Error(LINKING_ERROR)
}

type NativeRef = Component<SheetifyNativeViewProps> & Readonly<NativeMethods>
type FooterRef = Component<ViewProps> & Readonly<NativeMethods>

interface SheetifyState {
  scrollableHandle: number | null
  footerHandle: number | null
}

export class SheetifyView extends PureComponent<SheetifyViewProps, SheetifyState> {
  displayName = 'Sheetify'

  private readonly ref: RefObject<NativeRef>
  private readonly footerRef: RefObject<FooterRef>

  constructor(props: SheetifyViewProps) {
    super(props)

    this.ref = createRef<NativeRef>()
    this.footerRef = createRef<FooterRef>()

    this.onDismiss = this.onDismiss.bind(this)
    this.onPresent = this.onPresent.bind(this)
    this.onSizeChange = this.onSizeChange.bind(this)

    this.state = {
      scrollableHandle: null,
      footerHandle: null,
    }
  }

  private get handle(): number {
    const nodeHandle = findNodeHandle(this.ref.current)
    if (nodeHandle == null || nodeHandle === -1) {
      throw new Error(`Could not get native view tag`)
    }

    return nodeHandle
  }

  private updateHandles() {
    const scrollableHandle = this.props.scrollRef?.current
      ? findNodeHandle(this.props.scrollRef.current)
      : null

    const footerHandle = findNodeHandle(this.footerRef.current)

    this.setState({
      footerHandle,
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
    this.updateHandles()
  }

  componentDidUpdate(): void {
    this.updateHandles()
  }

  /**
   * Present the modal sheet at size index.
   * See `sizes` prop
   */
  public async present(index: number = 0) {
    await SheetifyModule.present(this.handle, index)
  }

  /**
   * Dismiss the Sheet
   */
  public async dismiss() {
    await SheetifyModule.dismiss(this.handle)
  }

  render(): ReactNode {
    const FooterComponent = this.props.FooterComponent

    return (
      <SheetifyNativeView
        ref={this.ref}
        style={$sheetify}
        scrollableHandle={this.state.scrollableHandle}
        footerHandle={this.state.footerHandle}
        sizes={this.props.sizes ?? ['medium', 'large']}
        backgroundColor={this.props.backgroundColor}
        onPresent={this.onPresent}
        onDismiss={this.onDismiss}
        onSizeChange={this.onSizeChange}
      >
        <View>
          <View style={this.props.style}>{this.props.children}</View>
          {!!FooterComponent && (
            <View ref={this.footerRef}>
              <FooterComponent />
            </View>
          )}
        </View>
      </SheetifyNativeView>
    )
  }
}

const $sheetify: ViewStyle = {
  position: 'absolute',
  zIndex: -99,
}
