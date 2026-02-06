import type { ComponentType, ReactElement } from 'react';
import type {
  ColorValue,
  NativeSyntheticEvent,
  StyleProp,
  ViewProps,
  ViewStyle,
} from 'react-native';

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
export type BackPressEvent = NativeSyntheticEvent<null>;

/**
 * Options for customizing the grabber (drag handle) appearance.
 */
export interface GrabberOptions {
  /**
   * The width of the grabber pill.
   *
   * @default iOS: 36, Android: 32
   */
  width?: number;
  /**
   * The height of the grabber pill.
   *
   * @default iOS: 5, Android: 4
   */
  height?: number;
  /**
   * The top margin of the grabber from the sheet edge.
   *
   * @default iOS: 5, Android: 16
   */
  topMargin?: number;
  /**
   * The corner radius of the grabber pill.
   *
   * @default height / 2
   */
  cornerRadius?: number;
  /**
   * The color of the grabber.
   * Uses native vibrancy/material styling when not provided.
   */
  color?: ColorValue;
  /**
   * Whether the grabber color adapts to light/dark mode.
   * When enabled, the grabber uses vibrancy effect on iOS and
   * adjusts color based on the current theme on Android.
   *
   * @default true
   */
  adaptive?: boolean;
}

/**
 * Options for scrollable behavior.
 */
export interface ScrollableOptions {
  /**
   * Extra offset when scrolling to the focused input when keyboard appears.
   *
   * @default 0
   */
  keyboardScrollOffset?: number;
}

/**
 * Options for customizing the blur effect.
 * Only applies when `backgroundBlur` is set.
 *
 * @platform ios
 */
export interface BlurOptions {
  /**
   * The intensity of the blur effect (0-100).
   * Uses system default if not provided.
   */
  intensity?: number;
  /**
   * Enables or disables user interaction on the blur view.
   * Disabling this can help with visual artifacts (flash) on iOS 18+
   * when touching the sheet content with blur enabled.
   *
   * @default true
   */
  interaction?: boolean;
}

/**
 * Defines the stack behavior when a modal is presented on web.
 *
 * @platform web
 */
export type StackBehavior =
  /**
   * Mount the modal on top of the current one.
   */
  | 'push'
  /**
   * Minimize the current modal then mount the new one.
   */
  | 'switch'
  /**
   * Dismiss the current modal then mount the new one.
   */
  | 'replace'
  /**
   * Use a regular BottomSheet instead of BottomSheetModal.
   * This bypasses the modal stack entirely.
   */
  | 'none';

/**
 * Inset adjustment behavior for the sheet content.
 */
export type InsetAdjustment =
  /**
   * Automatically adjusts the sheet height to account for system insets (safe area).
   * This ensures the sheet content is properly inset from system UI elements.
   */
  | 'automatic'
  /**
   * Does not adjust the sheet height for system insets.
   * The sheet height is calculated purely from the detent values.
   */
  | 'never';

/**
 * Blur style mapped to native values in IOS.
 *
 * @platform ios
 */
export type BackgroundBlur =
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
   * Use the `maxContentHeight` prop to set a custom limit.
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
   * Options for customizing the grabber appearance.
   * Only applies when `grabber` is `true`.
   */
  grabberOptions?: GrabberOptions;

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
   * Blends with `backgroundColor` when provided.
   *
   * @platform ios
   */
  backgroundBlur?: BackgroundBlur;

  /**
   * Options for customizing the blur effect.
   * Only applies when `backgroundBlur` is set.
   *
   * @platform ios
   */
  blurOptions?: BlurOptions;

  /**
   * Overrides `large` or `100%` height.
   * Also sets the maximum height for 'auto' detents.
   */
  maxContentHeight?: number;

  /**
   * The maximum width of the sheet content.
   * On Android, defaults to `640dp`. On iOS, the sheet uses system default width.
   */
  maxContentWidth?: number;

  /**
   * Controls how the sheet adjusts its height for system insets (safe area).
   *
   * - `'automatic'`: Adds the bottom safe area inset to the sheet height,
   *    ensuring content is properly inset from system UI elements.
   * - `'never'`: Does not adjust for insets; height is calculated purely from detent values.
   *
   * @default 'automatic'
   */
  insetAdjustment?: InsetAdjustment;

  /**
   * The elevation (shadow depth) of the sheet.
   *
   * @platform android
   * @platform web
   * @default 4
   */
  elevation?: number;

  /**
   * A component that is fixed at the top of the Sheet content.
   * Useful for search bars, titles, or other header content.
   */
  header?: ComponentType<unknown> | ReactElement;

  /**
   * Style for the header container.
   */
  headerStyle?: StyleProp<ViewStyle>;

  /**
   * A component that floats at the bottom of the Sheet.
   */
  footer?: ComponentType<unknown> | ReactElement;

  /**
   * Style for the footer container.
   */
  footerStyle?: StyleProp<ViewStyle>;

  /**
   * On iOS, automatically pins ScrollView or FlatList to fit within the sheet's available space.
   * When enabled, the ScrollView's top edge will be pinned below any top sibling views,
   * and its left, right, and bottom edges will be pinned to the container.
   *
   * On Android, it adds additional style to the content for scrollable to work.
   *
   * @default false
   */
  scrollable?: boolean;

  /**
   * Options for scrollable behavior.
   */
  scrollableOptions?: ScrollableOptions;

  /**
   * Defines the stack behavior when a modal is presented.
   * - `push`: Mount the modal on top of the current one.
   * - `switch`: Minimize the current modal then mount the new one.
   * - `replace`: Dismiss the current modal then mount the new one.
   * - `none`: Use a regular BottomSheet instead of BottomSheetModal.
   *
   * @platform web
   * @default 'switch'
   */
  stackBehavior?: StackBehavior;

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

  /**
   * Called when the hardware back button is pressed on Android.
   * Use this to handle custom back press behavior.
   *
   * @platform android
   */
  onBackPress?: (event: BackPressEvent) => void;
}
