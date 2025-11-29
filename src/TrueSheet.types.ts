import type { ComponentType, ReactElement } from 'react';
import type { ColorValue, NativeSyntheticEvent, ViewProps } from 'react-native';

export interface DetentInfoEventPayload {
  /**
   * The index position from the provided `detents`.
   */
  index: number;
  /**
   * The Y position of the sheet relative to the screen.
   */
  position: number;
  /**
   * The detent value (0-1) for the current index.
   */
  detent: number;
}

export interface PositionChangeEventPayload extends DetentInfoEventPayload {
  /**
   * Indicates whether the position value is real-time (e.g., during drag or animation tracking).
   * When false, the position should be animated in JS.
   */
  realtime: boolean;
}

export type MountEvent = NativeSyntheticEvent<null>;
export type DetentChangeEvent = NativeSyntheticEvent<DetentInfoEventPayload>;
export type WillPresentEvent = NativeSyntheticEvent<DetentInfoEventPayload>;
export type DidPresentEvent = NativeSyntheticEvent<DetentInfoEventPayload>;
export type WillDismissEvent = NativeSyntheticEvent<null>;
export type DidDismissEvent = NativeSyntheticEvent<null>;
export type DragBeginEvent = NativeSyntheticEvent<DetentInfoEventPayload>;
export type DragChangeEvent = NativeSyntheticEvent<DetentInfoEventPayload>;
export type DragEndEvent = NativeSyntheticEvent<DetentInfoEventPayload>;
export type PositionChangeEvent = NativeSyntheticEvent<PositionChangeEventPayload>;
export type DidFocusEvent = NativeSyntheticEvent<null>;
export type DidBlurEvent = NativeSyntheticEvent<null>;
export type WillFocusEvent = NativeSyntheticEvent<null>;
export type WillBlurEvent = NativeSyntheticEvent<null>;

/**
 * Blur style mapped to native values in IOS.
 *
 * @platform ios
 */
export type BlurTint =
  | 'light'
  | 'dark'
  | 'default'
  | 'extra-light'
  | 'regular'
  | 'prominent'
  | 'system-ultra-thin-material'
  | 'system-thin-material'
  | 'system-material'
  | 'system-thick-material'
  | 'system-chrome-material'
  | 'system-ultra-thin-material-light'
  | 'system-thin-material-light'
  | 'system-material-light'
  | 'system-thick-material-light'
  | 'system-chrome-material-light'
  | 'system-ultra-thin-material-dark'
  | 'system-thin-material-dark'
  | 'system-material-dark'
  | 'system-thick-material-dark'
  | 'system-chrome-material-dark';

/**
 * Supported Sheet detent.
 */
export type SheetDetent =
  /**
   * Auto resize based on content height, clamped to container height.
   * Use the `maxHeight` prop to set a custom limit.
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
  | number;

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
  name?: string;
  /**
   * The detents you want the Sheet to support.
   * Maximum of 3 detents only; collapsed, half-expanded, expanded.
   *
   * Example:
   * ```ts
   * detents={['auto', 0.6, 1]}
   * ```
   *
   * @note It's recommended to sort detents from smallest to largest.
   * When using `auto`, place it at the first index if you plan to adjust content dynamically.
   *
   * @default [0.5, 1]
   */
  detents?: SheetDetent[];

  /**
   * Specify whether the sheet background is dimmed.
   * Set to `false` to allow interaction with the background components.
   *
   * @default true
   */
  dimmed?: boolean;

  /**
   * Initially present the sheet, after mounting, at a given detent index.
   *
   * @note This property is only used during the initial mount.
   * @default -1
   */
  initialDetentIndex?: number;

  /**
   * Specify whether the sheet should animate after mounting.
   * Used with `initialDetentIndex`.
   *
   * @default true
   */
  initialDetentAnimated?: boolean;

  /**
   * The detent index that the sheet should start to dim the background.
   * This is ignored if `dimmed` is set to `false`.
   *
   * @default 0
   */
  dimmedDetentIndex?: number;

  /**
   * Prevents interactive dismissal of the Sheet.
   *
   * @default true
   */
  dismissible?: boolean;

  /**
   * Enables or disables dragging the sheet to resize it.
   * When disabled, the sheet becomes static and can only be resized programmatically.
   *
   * @default true
   */
  draggable?: boolean;

  /**
   * Main sheet background color.
   * Uses system default when not provided.
   */
  backgroundColor?: ColorValue;

  /**
   * The sheet corner radius.
   *
   * - `undefined` (not provided): Uses system default corner radius
   * - `0`: Sharp corners (no rounding)
   * - `> 0`: Custom corner radius value
   */
  cornerRadius?: number;

  /**
   * Shows a native grabber (or drag handle) on the sheet.
   *
   * iOS uses the native `UISheetPresentationController` grabber.
   * Android renders a native view following Material Design 3 specifications.
   *
   * @default true
   */
  grabber?: boolean;

  /**
   * Controls the sheet presentation style on iPad.
   * When enabled (true), uses a large page sheet for better readability.
   * When disabled (false), uses a centered form sheet.
   *
   * @platform ios 17+
   * @default true
   */
  pageSizing?: boolean;

  /**
   * The blur effect style on iOS.
   * Overrides `backgroundColor` if set.
   *
   * @platform ios
   */
  blurTint?: BlurTint;

  /**
   * Overrides `large` or `100%` height.
   * Also sets the maximum height for 'auto' detents.
   */
  maxHeight?: number;

  /**
   * Allows the sheet to extend behind the status bar when fully expanded in edge-to-edge mode.
   * When false (default), the sheet stops at the bottom of the status bar.
   *
   * @platform android
   * @default false
   */
  edgeToEdgeFullScreen?: boolean;

  /**
   * A component that is fixed at the top of the Sheet content.
   * Useful for search bars, titles, or other header content.
   */
  header?: ComponentType<unknown> | ReactElement;

  /**
   * A component that floats at the bottom of the Sheet.
   */
  footer?: ComponentType<unknown> | ReactElement;

  /**
   * Automatically pins ScrollView or FlatList to fit within the sheet's available space.
   * When enabled, the ScrollView's top edge will be pinned below any top sibling views,
   * and its left, right, and bottom edges will be pinned to the container.
   *
   * @platform ios
   * @default false
   */
  scrollable?: boolean;

  /**
   * Determines how the software keyboard will impact the layout of the sheet.
   * Set to `pan` if you're working with `FlatList` with a `TextInput`.
   *
   * @platform android
   * @default resize
   */
  keyboardMode?: 'resize' | 'pan';

  /**
   * Called when the sheet's content is mounted and ready.
   * The sheet automatically waits for this event before presenting.
   */
  onMount?: (event: MountEvent) => void;

  /**
   * Called when the Sheet is about to be presented.
   */
  onWillPresent?: (event: WillPresentEvent) => void;

  /**
   * Called when the Sheet has been presented.
   * Comes with the detent info.
   */
  onDidPresent?: (event: DidPresentEvent) => void;

  /**
   * Called when the Sheet is about to be dismissed
   */
  onWillDismiss?: (event: WillDismissEvent) => void;

  /**
   * Called when the Sheet has been dismissed
   */
  onDidDismiss?: (event: DidDismissEvent) => void;

  /**
   * Called when the detent of the sheet has changed.
   * Either by dragging or programatically.
   */
  onDetentChange?: (event: DetentChangeEvent) => void;

  /**
   * Called when the sheet has began dragging.
   * Comes with the detent info.
   */
  onDragBegin?: (event: DragBeginEvent) => void;

  /**
   * Called when the sheet is being dragged.
   * Comes with the detent info.
   */
  onDragChange?: (event: DragChangeEvent) => void;

  /**
   * Called when the sheet dragging has ended.
   * Comes with the detent info.
   */
  onDragEnd?: (event: DragEndEvent) => void;

  /**
   * Called when the sheet's position changes.
   * This fires continuously during sheet position changes.
   * Comes with the detent info.
   */
  onPositionChange?: (event: PositionChangeEvent) => void;

  /**
   * Called when the sheet is about to regain focus because a sheet presented on top of it is being dismissed.
   */
  onWillFocus?: (event: WillFocusEvent) => void;

  /**
   * Called when the sheet regains focus after a sheet presented on top of it is dismissed.
   */
  onDidFocus?: (event: DidFocusEvent) => void;

  /**
   * Called when the sheet is about to lose focus because another sheet is being presented on top of it.
   */
  onWillBlur?: (event: WillBlurEvent) => void;

  /**
   * Called when the sheet loses focus because another sheet is presented on top of it.
   */
  onDidBlur?: (event: DidBlurEvent) => void;
}
