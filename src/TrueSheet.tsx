import { PureComponent, type RefObject, createRef, type ReactNode } from 'react'
import {
  Platform,
  View,
  type ViewStyle,
  type NativeSyntheticEvent,
  type LayoutChangeEvent,
  processColor,
} from 'react-native'

import type {
  TrueSheetProps,
  DragBeginEvent,
  DragChangeEvent,
  DragEndEvent,
  SizeChangeEvent,
  PresentEvent,
} from './TrueSheet.types'
import TrueSheetViewNativeComponent, { Commands } from './TrueSheetViewNativeComponent'
import { TrueSheetGrabber } from './TrueSheetGrabber'
import { TrueSheetFooter } from './TrueSheetFooter'

const LINKING_ERROR =
  `The package '@lodev09/react-native-true-sheet' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n' +
  '- You are using the new architecture (Fabric)\n'

// Validate that Commands are available
if (!Commands) {
  throw new Error(LINKING_ERROR)
}

export type ContainerSizeChangeEvent = NativeSyntheticEvent<{ width: number; height: number }>

type NativeRef = React.ElementRef<typeof TrueSheetViewNativeComponent>

interface TrueSheetState {
  containerWidth?: number
  containerHeight?: number
  contentHeight?: number
  footerHeight?: number
  scrollableHandle: number | null
}

export class TrueSheet extends PureComponent<TrueSheetProps, TrueSheetState> {
  displayName = 'TrueSheet'

  private readonly ref: RefObject<NativeRef>

  /**
   * Map of sheet names against their ref.
   */
  private static readonly refs: { [name: string]: NativeRef } = {}

  constructor(props: TrueSheetProps) {
    super(props)

    this.ref = createRef<NativeRef>()

    this.onMount = this.onMount.bind(this)
    this.onDismiss = this.onDismiss.bind(this)
    this.onPresent = this.onPresent.bind(this)
    this.onSizeChange = this.onSizeChange.bind(this)
    this.onDragBegin = this.onDragBegin.bind(this)
    this.onDragChange = this.onDragChange.bind(this)
    this.onDragEnd = this.onDragEnd.bind(this)
    this.onContentLayout = this.onContentLayout.bind(this)
    this.onFooterLayout = this.onFooterLayout.bind(this)
    this.onContainerSizeChange = this.onContainerSizeChange.bind(this)

    this.state = {
      containerWidth: undefined,
      containerHeight: undefined,
      contentHeight: undefined,
      footerHeight: undefined,
      scrollableHandle: null,
    }
  }

  private static getRef(name: string) {
    const ref = TrueSheet.refs[name]
    if (!ref) {
      console.warn(`Could not get sheet ref from "${name}". Check your name prop.`)
      return
    }

    return ref
  }

  /**
   * Present the sheet by given `name`.
   * See `name` prop.
   */
  public static async present(name: string, index: number = 0) {
    const ref = TrueSheet.getRef(name)
    if (!ref) return

    Commands.present(ref, index)
  }

  /**
   * Dismiss the sheet by given `name`.
   * See `name` prop.
   */
  public static async dismiss(name: string) {
    const ref = TrueSheet.getRef(name)
    if (!ref) return

    Commands.dismiss(ref)
  }

  /**
   * Resize the sheet by given `name`.
   * See `name` prop.
   */
  public static async resize(name: string, index: number) {
    await TrueSheet.present(name, index)
  }

  private updateState(): void {
    const scrollableHandle = this.props.scrollRef?.current
      ? (this.props.scrollRef.current as any)._nativeTag || null
      : null

    if (this.props.name && this.ref.current) {
      TrueSheet.refs[this.props.name] = this.ref.current
    }

    this.setState({
      scrollableHandle,
    })
  }

  private onSizeChange(event: SizeChangeEvent): void {
    this.props.onSizeChange?.(event)
  }

  private onContainerSizeChange(event: ContainerSizeChangeEvent): void {
    this.setState({
      containerWidth: event.nativeEvent.width,
      containerHeight: event.nativeEvent.height,
    })
  }

  private onPresent(event: PresentEvent): void {
    this.props.onPresent?.(event)
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

  private onDragBegin(event: DragBeginEvent): void {
    this.props.onDragBegin?.(event)
  }

  private onDragChange(event: DragChangeEvent): void {
    this.props.onDragChange?.(event)
  }

  private onDragEnd(event: DragEndEvent): void {
    this.props.onDragEnd?.(event)
  }

  /**
   * Present the sheet. Optionally accepts a size `index`.
   * See `sizes` prop
   */
  public async present(index: number = 0): Promise<void> {
    if (this.ref.current) {
      Commands.present(this.ref.current, index)
    }
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
    if (this.ref.current) {
      Commands.dismiss(this.ref.current)
    }
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
      edgeToEdge = false,
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
      <TrueSheetViewNativeComponent
        ref={this.ref}
        style={$nativeSheet}
        scrollableHandle={this.state.scrollableHandle ?? null}
        sizes={sizes.map(String)}
        blurTint={blurTint ?? null}
        background={(processColor(backgroundColor) as number) ?? null}
        cornerRadius={cornerRadius ?? null}
        contentHeight={this.state.contentHeight ?? null}
        footerHeight={this.state.footerHeight ?? null}
        grabber={grabber}
        dimmed={dimmed}
        dimmedIndex={dimmedIndex ?? null}
        edgeToEdge={edgeToEdge}
        initialIndex={initialIndex ?? -1}
        initialIndexAnimated={initialIndexAnimated}
        keyboardMode={keyboardMode}
        dismissible={dismissible}
        maxHeight={maxHeight ?? null}
        onMount={this.onMount}
        onPresent={this.onPresent}
        onDismiss={this.onDismiss}
        onSizeChange={this.onSizeChange}
        onDragBegin={this.onDragBegin}
        onDragChange={this.onDragChange}
        onDragEnd={this.onDragEnd}
        onContainerSizeChange={this.onContainerSizeChange}
      >
        <View
          collapsable={false}
          style={[
            {
              overflow: Platform.select({ ios: undefined, android: 'hidden' }),

              // Update the width on JS side.
              // New Arch interop does not support updating it in native :/
              width: this.state.containerWidth,
              height: this.state.containerHeight,
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
      </TrueSheetViewNativeComponent>
    )
  }
}

const $nativeSheet: ViewStyle = {
  position: 'absolute',
  width: '100%',
  left: -9999,
  zIndex: -9999,
}
