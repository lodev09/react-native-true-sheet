import type { ComponentType, ReactElement } from 'react';
import type { ColorValue, NativeSyntheticEvent, ViewProps } from 'react-native';

import type { TrueSheetGrabberProps } from './TrueSheetGrabber';

export interface DetentInfoEventPayload {
  /**
   * The index position from the provided `detents`.
   */
  index: number;
  /**
   * The Y position of the sheet relative to the screen.
   */
  position: number;
}

export interface PositionChangeEventPayload extends DetentInfoEventPayload {
  /**
   * Workaround for cases where we can't get real-time position from native.
   * When true, manually animate the position in JS.
   */
  transitioning: boolean;
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
  | 'systemChromeMaterialDark';

/**
 * Supported Sheet detent.
 *
 * @platform android
 * @platform ios 15+
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
   * @default [0.5, 1]
   */
  detents?: SheetDetent[];

  /**
   * Specify whether the sheet background is dimmed.
   * Set to `false` to allow interaction with the background components.
   *
   * @platform android
   * @platform ios 15+
   * @default true
   */
  dimmed?: boolean;

  /**
   * Lazy-load the sheet's content on first `present()` call.
   * When `true`, the native view is created only when `present()` is called.
   * When `false`, the native view is created immediately on mount.
   *
   * @default false
   */
  lazy?: boolean;

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
  dimmedIndex?: number;

  /**
   * Prevents interactive dismissal of the Sheet.
   *
   * @default true
   */
  dismissible?: boolean;

  /**
   * Main sheet background color.

   * @default white
   */
  backgroundColor?: ColorValue;

  /**
   * The sheet corner radius.
   *
   * - `undefined` (not provided): Uses system default corner radius
   * - `0`: Sharp corners (no rounding)
   * - `> 0`: Custom corner radius value
   *
   * @platform android
   * @platform ios 15+
   */
  cornerRadius?: number;

  /**
   * Shows native grabber (or handle) on IOS.
   *
   * @platform ios
   * @default true
   */
  grabber?: boolean;

  /**
   * Grabber props to be used for android grabber or handle.
   *
   * @platform android
   */
  grabberProps?: TrueSheetGrabberProps;

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
   * A component that floats at the bottom of the Sheet.
   */
  footer?: ComponentType<unknown> | ReactElement;

  /**
   * Determines how the software keyboard will impact the layout of the sheet.
   * Set to `pan` if you're working with `FlatList` with a `TextInput`.
   *
   * @platform android
   * @default resize
   */
  keyboardMode?: 'resize' | 'pan';

  /**
   * Supports edge-to-edge on Android.
   * Turn this on if your app has it enabled.
   *
   * @platform android
   */
  edgeToEdge?: boolean;

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
   *
   * @platform android
   * @platform ios 15+
   */
  onDragBegin?: (event: DragBeginEvent) => void;

  /**
   * Called when the sheet is being dragged.
   * Comes with the detent info.
   *
   * @platform android
   * @platform ios 15+
   */
  onDragChange?: (event: DragChangeEvent) => void;

  /**
   * Called when the sheet dragging has ended.
   * Comes with the detent info.
   *
   * @platform android
   * @platform ios 15+
   */
  onDragEnd?: (event: DragEndEvent) => void;

  /**
   * Called when the sheet's position changes.
   * This fires continuously during sheet position changes.
   * Comes with the detent info.
   *
   * @platform android
   * @platform ios 15+
   */
  onPositionChange?: (event: PositionChangeEvent) => void;
}
