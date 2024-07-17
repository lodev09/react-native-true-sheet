import type { Component, ComponentType, ReactElement, RefObject } from 'react'
import type { ColorValue, StyleProp, ViewProps, ViewStyle } from 'react-native'

import type { TrueSheetGrabberProps } from './TrueSheetGrabber'

export interface SizeInfo {
  index: number
  value: number
}

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
 * Supported Sheet size.
 *
 * @platform android
 * @platform ios 15+
 */
export type SheetSize =
  /**
   * Auto resize based on content height
   *
   * @platform android
   * @platform ios 16+
   */
  | 'auto'

  /**
   * Fixed height
   *
   * @platform android
   * @platform ios 16+
   */
  | number

  /**
   * Fixed height in %
   *
   * @platform android
   * @platform ios 16+
   */
  | `${number}%`

  /**
   * Translates to 25%
   *
   * @platform android
   * @platform ios 16+
   */
  | 'small'

  /**
   * Translates to 50%
   *
   * @platform android
   * @platform ios 15+
   */
  | 'medium'

  /**
   * Translates to 100%
   *
   * @platform android
   * @platform ios 15+
   */
  | 'large'

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
   * The sizes you want the Sheet to support.
   * Maximum of 3 sizes only; collapsed, half-expanded, expanded.
   *
   * Example:
   * ```ts
   * size={['auto', '60%', 'large']}
   * ```
   *
   * @default ['medium', 'large']
   */
  sizes?: SheetSize[]

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
   * Initially present the sheet, after mounting, at a given size index.
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
   * The size index that the sheet should start to dim the background.
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
   * Main sheet background color
   *
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
   * Optional content container styles.
   */
  contentContainerStyle?: StyleProp<ViewStyle>

  /**
   * The main scrollable ref that Sheet should handle on IOS.
   *
   * @platform ios
   */
  scrollRef?: RefObject<Component<unknown>>

  /**
   * Overrides `large` or `100%` height.
   */
  maxHeight?: number

  /**
   * A component that floats at the bottom of the Sheet.
   */
  FooterComponent?: ComponentType<unknown> | ReactElement

  /**
   * Determines how the software keyboard will impact the layout of the sheet.
   * Set to `pan` if you're working with `FlatList` with a `TextInput`.
   *
   * @platform android
   * @default resize
   */
  keyboardMode?: 'resize' | 'pan'

  /**
   * This is called when the sheet is ready to present.
   */
  onMount?: () => void

  /**
   * Called when the Sheet has been presented.
   * Comes with the size info.
   */
  onPresent?: (info: SizeInfo) => void

  /**
   * Called when the Sheet has been dismissed
   */
  onDismiss?: () => void

  /**
   * Called when the size of the sheet has changed.
   * Either by dragging or programatically.
   */
  onSizeChange?: (info: SizeInfo) => void

  /**
   * React tag of the view to anchor the popover.
   * @platform ios
   */
  anchorViewTag?: number
}
