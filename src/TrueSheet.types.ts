import type { ComponentType, ReactElement } from 'react'
import type { ColorValue, NativeSyntheticEvent, ViewProps } from 'react-native'

import type { TrueSheetGrabberProps } from './TrueSheetGrabber'

export interface DetentInfo {
  index: number
  value: number
}

export type DetentChangeEvent = NativeSyntheticEvent<DetentInfo>
export type PresentEvent = NativeSyntheticEvent<DetentInfo>
export type DragBeginEvent = NativeSyntheticEvent<DetentInfo>
export type DragChangeEvent = NativeSyntheticEvent<DetentInfo>
export type DragEndEvent = NativeSyntheticEvent<DetentInfo>

/**
 * Blur style mapped to native values in IOS.
 *
 * @platform ios
 */
export type BlurTint =
  | 'light'
  | 'dark'
  | 'default'
  | 'extraLight'
  | 'regular'
  | 'prominent'
  | 'systemUltraThinMaterial'
  | 'systemThinMaterial'
  | 'systemMaterial'
  | 'systemThickMaterial'
  | 'systemChromeMaterial'
  | 'systemUltraThinMaterialLight'
  | 'systemThinMaterialLight'
  | 'systemMaterialLight'
  | 'systemThickMaterialLight'
  | 'systemChromeMaterialLight'
  | 'systemUltraThinMaterialDark'
  | 'systemThinMaterialDark'
  | 'systemMaterialDark'
  | 'systemThickMaterialDark'
  | 'systemChromeMaterialDark'

/**
 * Supported Sheet detent.
 *
 * @platform android
 * @platform ios 15+
 */
export type SheetDetent =
  /**
   * Auto resize based on content height
   *
   * @platform android
   * @platform ios 16+
   */
  | 'auto'

  /**
   * Relative height as a fraction (0-1) of the available height.
   * For example, 0.5 represents 50% of the available height.
   *
   * @platform android
   * @platform ios 16+
   */
  | number

export interface TrueSheetProps extends ViewProps {
  /**
   * The name to reference this sheet. It has to be unique.
   * You can then present this sheet globally using its `name`.
   *
   * Example:
   * ```ts
   * <TrueSheet name="my-awesome-sheet">
   *   <MyComponent />
   * </TrueSheet>
   * ```
   * ```ts
   * TrueSheet.present('my-awesome-sheet')
   * ```
   */
  name?: string
  /**
   * The detents you want the Sheet to support.
   * Maximum of 3 detents only; collapsed, half-expanded, expanded.
   *
   * Example:
   * ```ts
   * detents={['auto', 0.6, 1]}
   * ```
   *
   * @default [0.5, 1]
   */
  detents?: SheetDetent[]

  /**
   * Specify whether the sheet background is dimmed.
   * Set to `false` to allow interaction with the background components.
   *
   * @platform android
   * @platform ios 15+
   * @default true
   */
  dimmed?: boolean

  /**
   * Initially present the sheet, after mounting, at a given detent index.
   *
   * @note This property is only used during the initial mount.
   * @default -1
   */
  initialIndex?: number

  /**
   * Specify whether the sheet should animate after mounting.
   * Used with `initialIndex`.
   *
   * @default true
   */
  initialIndexAnimated?: boolean

  /**
   * The detent index that the sheet should start to dim the background.
   * This is ignored if `dimmed` is set to `false`.
   *
   * @default 0
   */
  dimmedIndex?: number

  /**
   * Prevents interactive dismissal of the Sheet.
   *
   * @default true
   */
  dismissible?: boolean

  /**
   * Main sheet background color.

   * @default white
   */
  backgroundColor?: ColorValue

  /**
   * The sheet corner radius.
   *
   * @platform android
   * @platform ios 15+
   */
  cornerRadius?: number

  /**
   * Shows native grabber (or handle) on IOS.
   *
   * @platform ios
   * @default true
   */
  grabber?: boolean

  /**
   * Grabber props to be used for android grabber or handle.
   *
   * @platform android
   */
  grabberProps?: TrueSheetGrabberProps

  /**
   * The blur effect style on iOS.
   * Overrides `backgroundColor` if set.
   *
   * @platform ios
   */
  blurTint?: BlurTint

  /**
   * Overrides `large` or `100%` height.
   */
  maxHeight?: number

  /**
   * A component that floats at the bottom of the Sheet.
   */
  footer?: ComponentType<unknown> | ReactElement

  /**
   * Determines how the software keyboard will impact the layout of the sheet.
   * Set to `pan` if you're working with `FlatList` with a `TextInput`.
   *
   * @platform android
   * @default resize
   */
  keyboardMode?: 'resize' | 'pan'

  /**
   * Supports edge-to-edge on Android.
   * Turn this on if your app has it enabled.
   *
   * @platform android
   */
  edgeToEdge?: boolean

  /**
   * This is called when the sheet is ready to present.
   */
  onMount?: () => void

  /**
   * Called when the Sheet has been presented.
   * Comes with the detent info.
   */
  onPresent?: (event: PresentEvent) => void

  /**
   * Called when the Sheet has been dismissed
   */
  onDismiss?: () => void

  /**
   * Called when the detent of the sheet has changed.
   * Either by dragging or programatically.
   */
  onDetentChange?: (event: DetentChangeEvent) => void

  /**
   * Called when the sheet has began dragging.
   * Comes with the detent info.
   *
   * @platform android
   * @platform ios 15+
   */
  onDragBegin?: (event: DragBeginEvent) => void

  /**
   * Called when the sheet is being dragged.
   * Comes with the detent info.
   *
   * @platform android
   * @platform ios 15+
   */
  onDragChange?: (event: DragChangeEvent) => void

  /**
   * Called when the sheet dragging has ended.
   * Comes with the detent info.
   *
   * @platform android
   * @platform ios 15+
   */
  onDragEnd?: (event: DragEndEvent) => void
}
