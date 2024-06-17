import React, { PureComponent, Component, type RefObject, createRef, type ReactNode } from 'react'
import {
  requireNativeComponent,
  Platform,
  findNodeHandle,
  View,
  type NativeMethods,
  type ViewStyle,
  type NativeSyntheticEvent,
  type LayoutChangeEvent,
} from 'react-native'

import type { TrueSheetProps, SizeInfo } from './TrueSheet.types'
import { TrueSheetModule } from './TrueSheetModule'
import { TrueSheetGrabber } from './TrueSheetGrabber'
import { TrueSheetFooter } from './TrueSheetFooter'

const NATIVE_COMPONENT_NAME = 'TrueSheetView'
const LINKING_ERROR =
  `The package '@lodev09/react-native-true-sheet' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n'

interface TrueSheetNativeViewProps extends Omit<TrueSheetProps, 'onPresent' | 'onSizeChange'> {
  contentHeight?: number
  footerHeight?: number
  scrollableHandle: number | null
  onPresent: (event: NativeSyntheticEvent<SizeInfo>) => void
  onSizeChange: (event: NativeSyntheticEvent<SizeInfo>) => void
}

type NativeRef = Component<TrueSheetNativeViewProps> & Readonly<NativeMethods>

interface TrueSheetState {
  contentHeight?: number
  footerHeight?: number
  scrollableHandle: number | null
}

const TrueSheetNativeView = requireNativeComponent<TrueSheetNativeViewProps>(NATIVE_COMPONENT_NAME)

if (!TrueSheetNativeView) {
  throw new Error(LINKING_ERROR)
}

export class TrueSheet extends PureComponent<TrueSheetProps, TrueSheetState> {
  displayName = 'TrueSheet'

  private readonly ref: RefObject<NativeRef>

  /**
   * Map of sheet names against their handle.
   */
  private static readonly handles: { [name: string]: number } = {}

  constructor(props: TrueSheetProps) {
    super(props)

    this.ref = createRef<NativeRef>()

    this.onMount = this.onMount.bind(this)
    this.onDismiss = this.onDismiss.bind(this)
    this.onPresent = this.onPresent.bind(this)
    this.onSizeChange = this.onSizeChange.bind(this)
    this.onContentLayout = this.onContentLayout.bind(this)
    this.onFooterLayout = this.onFooterLayout.bind(this)

    this.state = {
      contentHeight: undefined,
      footerHeight: undefined,
      scrollableHandle: null,
    }
  }

  private static getHandle(name: string) {
    const handle = TrueSheet.handles[name]
    if (!handle) {
      console.warn(`Could not get native view tag from "${name}". Check your name prop.`)
      return
    }

    return handle
  }

  /**
   * Present the sheet by given `name`.
   * See `name` prop.
   */
  public static async present(name: string, index: number = 0) {
    const handle = TrueSheet.getHandle(name)
    if (!handle) return

    await TrueSheetModule.present(handle, index)
  }

  /**
   * Dismiss the sheet by given `name`.
   * See `name` prop.
   */
  public static async dismiss(name: string) {
    const handle = TrueSheet.getHandle(name)
    if (!handle) return

    await TrueSheetModule.dismiss(handle)
  }

  /**
   * Resize the sheet by given `name`.
   * See `name` prop.
   */
  public static async resize(name: string, index: number) {
    await TrueSheet.present(name, index)
  }

  private get handle(): number {
    const nodeHandle = findNodeHandle(this.ref.current)
    if (nodeHandle == null || nodeHandle === -1) {
      throw new Error('Could not get native view tag')
    }

    return nodeHandle
  }

  private updateState(): void {
    const scrollableHandle = this.props.scrollRef?.current
      ? findNodeHandle(this.props.scrollRef.current)
      : null

    if (this.props.name) {
      TrueSheet.handles[this.props.name] = this.handle
    }

    this.setState({
      scrollableHandle,
    })
  }

  private onSizeChange(event: NativeSyntheticEvent<SizeInfo>): void {
    this.props.onSizeChange?.(event.nativeEvent)
  }

  private onPresent(event: NativeSyntheticEvent<SizeInfo>): void {
    this.props.onPresent?.(event.nativeEvent)
  }

  private onFooterLayout(event: LayoutChangeEvent): void {
    this.setState({
      footerHeight: event.nativeEvent.layout.height,
    })
  }

  private onContentLayout(event: LayoutChangeEvent): void {
    this.setState({
      contentHeight: event.nativeEvent.layout.height,
    })
  }

  private onDismiss(): void {
    this.props.onDismiss?.()
  }

  private onMount(): void {
    this.props.onMount?.()
  }

  /**
   * Present the sheet. Optionally accepts a size `index`.
   * See `sizes` prop
   */
  public async present(index: number = 0): Promise<void> {
    await TrueSheetModule.present(this.handle, index)
  }

  /**
   * Resizes the Sheet programmatically by `index`.
   * This is an alias of the `present(index)` method.
   */
  public async resize(index: number): Promise<void> {
    await this.present(index)
  }

  /**
   * Dismisses the Sheet
   */
  public async dismiss(): Promise<void> {
    await TrueSheetModule.dismiss(this.handle)
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

  render(): ReactNode {
    const {
      sizes = ['medium', 'large'],
      backgroundColor = 'white',
      dismissible = true,
      grabber = true,
      dimmed = true,
      initialIndexAnimated = true,
      keyboardMode = 'resize',
      initialIndex,
      dimmedIndex,
      grabberProps,
      blurTint,
      cornerRadius,
      maxHeight,
      FooterComponent,
      style,
      contentContainerStyle,
      children,
      ...rest
    } = this.props

    return (
      <TrueSheetNativeView
        ref={this.ref}
        style={$nativeSheet}
        scrollableHandle={this.state.scrollableHandle}
        sizes={sizes}
        blurTint={blurTint}
        cornerRadius={cornerRadius}
        contentHeight={this.state.contentHeight}
        footerHeight={this.state.footerHeight}
        grabber={grabber}
        dimmed={dimmed}
        dimmedIndex={dimmedIndex}
        initialIndex={initialIndex}
        initialIndexAnimated={initialIndexAnimated}
        keyboardMode={keyboardMode}
        dismissible={dismissible}
        maxHeight={maxHeight}
        onMount={this.onMount}
        onPresent={this.onPresent}
        onDismiss={this.onDismiss}
        onSizeChange={this.onSizeChange}
      >
        <View
          collapsable={false}
          style={[
            {
              overflow: Platform.select({ ios: undefined, android: 'hidden' }),
              borderTopLeftRadius: cornerRadius,
              borderTopRightRadius: cornerRadius,

              // Remove backgroundColor if `blurTint` is set on iOS
              backgroundColor: Platform.select({
                ios: blurTint ? undefined : backgroundColor,
                android: backgroundColor,
              }),
            },
            style,
          ]}
          {...rest}
        >
          <View collapsable={false} onLayout={this.onContentLayout} style={contentContainerStyle}>
            {children}
          </View>
          <View collapsable={false} onLayout={this.onFooterLayout}>
            <TrueSheetFooter Component={FooterComponent} />
          </View>
          {Platform.OS === 'android' && <TrueSheetGrabber visible={grabber} {...grabberProps} />}
        </View>
      </TrueSheetNativeView>
    )
  }
}

const $nativeSheet: ViewStyle = {
  position: 'absolute',
  width: '100%',
  left: -9999,
  zIndex: -9999,
}
