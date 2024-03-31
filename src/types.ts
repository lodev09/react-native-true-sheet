import type { Component, ComponentType, RefObject } from 'react'
import type { ColorValue, ViewProps } from 'react-native'

export interface SizeChangeEvent {
  index: number
  value: number
}

/**
 * Supported Sheet size.
 * Requires IOS 15+
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
   * Main sheet background color
   */
  backgroundColor?: ColorValue

  /**
   * The main scrollable ref that Sheet should handle on IOS.
   * @platform ios
   */
  scrollRef?: RefObject<Component<unknown>>

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
   * A component that floats at the bottom of the Sheet.
   */
  FooterComponent?: ComponentType<unknown>

  /**
   * Called when the Sheet has been presented.
   * Comes with the size index.
   */
  onPresent?: () => void

  /**
   * Called when the Sheet has been dismissed
   */
  onDismiss?: () => void

  /**
   * Called when the size of the sheet has changed.
   * Either by dragging or programatically.
   */
  onSizeChange?: (event: SizeChangeEvent) => void
}
