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

import type { TrueSheetProps, SizeInfo } from './types'
import { TrueSheetModule } from './TrueSheetModule'
import { TrueSheetGrabber } from './TrueSheetGrabber'

const LINKING_ERROR =
  `The package '@lodev09/react-native-true-sheet' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n'

const ComponentName = 'TrueSheetView'

interface TrueSheetNativeViewProps extends Omit<TrueSheetProps, 'onPresent' | 'onSizeChange'> {
  scrollableHandle: number | null
  onPresent: (event: NativeSyntheticEvent<SizeInfo>) => void
  onSizeChange: (event: NativeSyntheticEvent<SizeInfo>) => void
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

  private updateState(): void {
    const scrollableHandle = this.props.scrollRef?.current
      ? findNodeHandle(this.props.scrollRef.current)
      : null

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
   * Present the modal sheet. Optionally accepts a size `index`.
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

  render(): ReactNode {
    const {
      sizes = ['medium', 'large'],
      backgroundColor = 'white',
      dismissible = true,
      grabber = true,
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
        grabber={grabber}
        dismissible={dismissible}
        maxHeight={maxHeight}
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
          <View collapsable={false} style={contentContainerStyle}>
            {children}
          </View>
          <View collapsable={false}>
            <TrueSheetFooter FooterComponent={FooterComponent} />
          </View>
          {Platform.OS === 'android' && <TrueSheetGrabber visible={grabber} {...grabberProps} />}
        </View>
      </TrueSheetNativeView>
    )
  }
}

const TrueSheetFooter = (props: Pick<TrueSheetProps, 'FooterComponent'>) => {
  const { FooterComponent } = props

  if (!FooterComponent) return null

  if (typeof FooterComponent !== 'function') {
    return FooterComponent
  }

  return <FooterComponent />
}

const $nativeSheet: ViewStyle = {
  position: 'absolute',
  left: -9999,
  zIndex: -9999,
}
