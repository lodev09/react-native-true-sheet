import {
  PureComponent,
  type RefObject,
  createRef,
  type ReactNode,
  type ComponentRef,
  isValidElement,
  createElement,
} from 'react'

import type {
  TrueSheetProps,
  DragBeginEvent,
  DragChangeEvent,
  DragEndEvent,
  DetentChangeEvent,
  PresentEvent,
} from './TrueSheet.types'
import TrueSheetViewNativeComponent from './TrueSheetViewNativeComponent'
import TrueSheetContainerViewNativeComponent from './TrueSheetContainerViewNativeComponent'
import TrueSheetFooterViewNativeComponent from './TrueSheetFooterViewNativeComponent'
import { Platform, processColor, View, type ViewStyle, findNodeHandle } from 'react-native'

const LINKING_ERROR =
  `The package '@lodev09/react-native-true-sheet' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n' +
  '- You are using the new architecture (Fabric)\n'

// Lazy load TurboModule
let TrueSheetModule: any = null
const getTurboModule = () => {
  if (TrueSheetModule === null) {
    try {
      const { default: module } = require('./specs/NativeTrueSheetModule')
      TrueSheetModule = module
    } catch (error) {
      throw new Error(LINKING_ERROR)
    }
  }
  return TrueSheetModule
}

type NativeRef = ComponentRef<typeof TrueSheetViewNativeComponent>

export class TrueSheet extends PureComponent<TrueSheetProps> {
  displayName = 'TrueSheet'

  private readonly ref: RefObject<NativeRef | null>

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
    this.onDetentChange = this.onDetentChange.bind(this)
    this.onDragBegin = this.onDragBegin.bind(this)
    this.onDragChange = this.onDragChange.bind(this)
    this.onDragEnd = this.onDragEnd.bind(this)
  }

  private static getHandle(name: string) {
    const handle = TrueSheet.handles[name]
    if (!handle) {
      console.warn(`Could not get native view tag from "${name}". Check your name prop.`)
      return
    }

    return handle
  }

  private get handle(): number {
    const nodeHandle = findNodeHandle(this.ref.current)
    if (nodeHandle == null || nodeHandle === -1) {
      throw new Error('Could not get native view tag')
    }

    return nodeHandle
  }

  /**
   * Present the sheet by given `name` (Promise-based)
   * @param name - Sheet name (must match sheet's name prop)
   * @param index - Detent index (default: 0)
   * @returns Promise that resolves when sheet is fully presented
   * @throws Error if sheet not found or presentation fails
   */
  public static async present(name: string, index: number = 0): Promise<void> {
    const handle = TrueSheet.getHandle(name)
    if (!handle) {
      throw new Error(`Sheet with name "${name}" not found`)
    }

    const module = getTurboModule()
    if (!module) {
      throw new Error('TurboModule not available. Make sure new architecture is enabled.')
    }

    return module.presentByRef(handle, index)
  }

  /**
   * Dismiss the sheet by given `name` (Promise-based)
   * @param name - Sheet name
   * @returns Promise that resolves when sheet is fully dismissed
   * @throws Error if sheet not found or dismissal fails
   */
  public static async dismiss(name: string): Promise<void> {
    const handle = TrueSheet.getHandle(name)
    if (!handle) {
      throw new Error(`Sheet with name "${name}" not found`)
    }

    const module = getTurboModule()
    if (!module) {
      throw new Error('TurboModule not available. Make sure new architecture is enabled.')
    }

    return module.dismissByRef(handle)
  }

  /**
   * Resize the sheet by given `name` (Promise-based)
   * @param name - Sheet name
   * @param index - New detent index
   * @returns Promise that resolves when resize is complete
   * @throws Error if sheet not found
   */
  public static async resize(name: string, index: number): Promise<void> {
    const handle = TrueSheet.getHandle(name)
    if (!handle) {
      throw new Error(`Sheet with name "${name}" not found`)
    }

    const module = getTurboModule()
    if (!module) {
      throw new Error('TurboModule not available. Make sure new architecture is enabled.')
    }

    return module.resizeByRef(handle, index)
  }

  private updateState(): void {
    if (this.props.name) {
      TrueSheet.handles[this.props.name] = this.handle
    }
  }

  private onDetentChange(event: DetentChangeEvent): void {
    this.props.onDetentChange?.(event)
  }

  private onPresent(event: PresentEvent): void {
    this.props.onPresent?.(event)
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
   * Present the sheet. Optionally accepts a detent `index`.
   * See `detents` prop
   */
  public async present(index: number = 0): Promise<void> {
    const module = getTurboModule()
    return module.presentByRef(this.handle, index)
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
    const module = getTurboModule()
    return module.dismissByRef(this.handle)
  }

  componentDidMount(): void {
    if (this.props.detents && this.props.detents.length > 3) {
      console.warn(
        'TrueSheet only supports a maximum of 3 detents; collapsed, half-expanded and expanded. Check your `detents` prop.'
      )
    }

    this.updateState()
  }

  componentDidUpdate(): void {
    this.updateState()
  }

  render(): ReactNode {
    const {
      detents = [0.5, 1],
      backgroundColor = 'white',
      dismissible = true,
      grabber = true,
      dimmed = true,
      initialIndexAnimated = true,
      edgeToEdge = false,
      keyboardMode = 'resize',
      initialIndex,
      dimmedIndex,
      blurTint,
      cornerRadius,
      maxHeight,
      children,
      style,
      FooterComponent,
      ...rest
    } = this.props

    return (
      <TrueSheetViewNativeComponent
        ref={this.ref}
        style={$nativeSheet}
        detents={detents.map(String)}
        blurTint={blurTint}
        background={(processColor(backgroundColor) as number) ?? 0}
        cornerRadius={cornerRadius}
        grabber={grabber}
        dimmed={dimmed}
        dimmedIndex={dimmedIndex}
        edgeToEdge={edgeToEdge}
        initialIndex={initialIndex ?? -1}
        initialIndexAnimated={initialIndexAnimated}
        keyboardMode={keyboardMode}
        dismissible={dismissible}
        maxHeight={maxHeight}
        onMount={this.onMount}
        onPresent={this.onPresent}
        onDismiss={this.onDismiss}
        onDetentChange={this.onDetentChange}
        onDragBegin={this.onDragBegin}
        onDragChange={this.onDragChange}
        onDragEnd={this.onDragEnd}
      >
        <TrueSheetContainerViewNativeComponent style={$contentView} collapsable={false}>
          <View style={style} {...rest}>
            {children}
          </View>
        </TrueSheetContainerViewNativeComponent>
        {FooterComponent && (
          <TrueSheetFooterViewNativeComponent collapsable={false}>
            {isValidElement(FooterComponent) ? FooterComponent : createElement(FooterComponent)}
          </TrueSheetFooterViewNativeComponent>
        )}
      </TrueSheetViewNativeComponent>
    )
  }
}

const $nativeSheet: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
}

const $contentView: ViewStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
}
