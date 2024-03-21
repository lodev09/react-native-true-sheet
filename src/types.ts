import type { Component, RefObject } from 'react'
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
   * Sort them by ascending order
   *
   * Example:
   * ```ts
   * size={['auto', 400, '80%']}
   * ```
   *
   * @default ['medium', 'large']
   */
  sizes?: SheetifySize[]
}
