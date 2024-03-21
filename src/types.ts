import type { Component, ComponentType, RefObject } from 'react'
import type { ColorValue, ViewProps } from 'react-native'

/**
 * Supported Sheet size.
 * Requires IOS 15+
 */
export type SheetifySize =
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

export interface SheetifyViewProps extends ViewProps {
  /**
   * Main sheet background color
   */
  backgroundColor?: ColorValue

  /**
   * The main scrollable ref that Sheetify should handle.
   */
  scrollRef?: RefObject<Component<unknown>>

  /**
   * The sizes you want the Sheet to support.
   * IMPORTANT! Sort them in ascending order
   *
   * Example:
   * ```ts
   * size={['auto', 400, '80%', 'large']}
   * ```
   *
   * @default ['medium', 'large']
   */
  sizes?: SheetifySize[]

  /**
   * A component that floats to the top of the Sheet.
   * Scrollable insets are adjusted automatically.
   */
  HeaderComponent?: ComponentType<unknown>

  /**
   * A component that floats to the bottom of the Sheet.
   * Scrollable insets are adjusted automatically.
   */
  FooterComponent?: ComponentType<unknown>
}
