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

import type { TrueSheetProps, SizeChangeEvent } from './types'
import { TrueSheetModule } from './TrueSheetModule'

const LINKING_ERROR =
  `The package '@lodev09/react-native-true-sheet' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n'

const ComponentName = 'TrueSheetView'

interface TrueSheetNativeViewProps {
  scrollableHandle: number | null
  footerHandle: number | null
  onDismiss: () => void
  onPresent: (event: NativeSyntheticEvent<{ index: number }>) => void
  onSizeChange: (event: NativeSyntheticEvent<SizeChangeEvent>) => void
  children: ReactNode
  backgroundColor?: ColorValue
  style: StyleProp<ViewStyle>
  sizes: TrueSheetProps['sizes']
}

const TrueSheetNativeView = requireNativeComponent<TrueSheetNativeViewProps>(ComponentName)

if (!TrueSheetNativeView) {
  throw new Error(LINKING_ERROR)
}

type NativeRef = Component<TrueSheetNativeViewProps> & Readonly<NativeMethods>
type FooterRef = Component<ViewProps> & Readonly<NativeMethods>

interface TrueSheetState {
  scrollableHandle: number | null
  footerHandle: number | null
}

export class TrueSheet extends PureComponent<TrueSheetProps, TrueSheetState> {
  displayName = 'TrueSheet'

  private readonly ref: RefObject<NativeRef>
  private readonly footerRef: RefObject<FooterRef>

  constructor(props: TrueSheetProps) {
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
      </TrueSheetNativeView>
    )
  }
}

const $nativeSheet: ViewStyle = {
  position: 'absolute',
  zIndex: -99,
}
