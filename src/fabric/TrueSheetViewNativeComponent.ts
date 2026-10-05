import type { CodegenTypes, ColorValue, ProcessedColorValue, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

type GrabberOptionsType = Readonly<{
  width?: CodegenTypes.Double;
  height?: CodegenTypes.Double;
  topMargin?: CodegenTypes.Double;
  cornerRadius?: CodegenTypes.WithDefault<CodegenTypes.Double, -1>;
  color?: ProcessedColorValue | null;
  adaptive?: CodegenTypes.WithDefault<boolean, true>;
}>;

type AccessibilityOptionsType = Readonly<{
  grabberLabel?: CodegenTypes.WithDefault<string, 'Sheet Grabber'>;
  grabberHint?: CodegenTypes.WithDefault<
    string,
    'Double-tap to expand. Swipe up or down to resize the sheet'
  >;
  expandedValue?: CodegenTypes.WithDefault<string, 'Expanded'>;
  collapsedValue?: CodegenTypes.WithDefault<string, 'Collapsed'>;
  detentValue?: CodegenTypes.WithDefault<string, 'Detent {index} of {count}'>;
  expandActionLabel?: CodegenTypes.WithDefault<string, 'Expand'>;
  collapseActionLabel?: CodegenTypes.WithDefault<string, 'Collapse'>;
  paneTitle?: CodegenTypes.WithDefault<string, 'Bottom sheet'>;
}>;

type ScrollEdgeEffect = 'automatic' | 'hard' | 'soft' | 'hidden';

type ScrollableOptionsType = Readonly<{
  contentInsetAdjustment?: CodegenTypes.WithDefault<
    'automatic' | 'safe-area' | 'footer' | 'never',
    'automatic'
  >;
  keyboardScrollOffset?: CodegenTypes.WithDefault<CodegenTypes.Double, 0>;
  keyboardOffset?: CodegenTypes.WithDefault<CodegenTypes.Double, 0>;
  scrollingExpandsSheet?: CodegenTypes.WithDefault<boolean, true>;
  topScrollEdgeEffect?: CodegenTypes.WithDefault<ScrollEdgeEffect, 'hidden'>;
  bottomScrollEdgeEffect?: CodegenTypes.WithDefault<ScrollEdgeEffect, 'hidden'>;
}>;

type FooterOptionsType = Readonly<{
  // Named uniquely across option structs — codegen derives the enum name from
  // the field name, so a second `position` would redefine TrueSheetViewPosition
  footerPosition?: CodegenTypes.WithDefault<'relative' | 'absolute', 'relative'>;
  keyboardOffset?: CodegenTypes.WithDefault<CodegenTypes.Double, 0>;
  avoidKeyboard?: CodegenTypes.WithDefault<boolean, true>;
}>;

type HeaderOptionsType = Readonly<{
  position?: CodegenTypes.WithDefault<'relative' | 'absolute', 'relative'>;
}>;

export interface DetentInfoEventPayload {
  index: CodegenTypes.Int32;
  position: CodegenTypes.Double;
  detent: CodegenTypes.Double;
}

export interface PositionChangeEventPayload {
  index: CodegenTypes.Double;
  position: CodegenTypes.Double;
  detent: CodegenTypes.Double;
  realtime: boolean;
}

export interface NativeProps extends ViewProps {
  // Array properties
  detents?: ReadonlyArray<CodegenTypes.Double>;
  detentBackgrounds?: ReadonlyArray<
    Readonly<{
      color?: ProcessedColorValue | null;
      blur?: string;
    }>
  >;

  // Number properties - use 0 as default to avoid nil insertion
  maxContentHeight?: CodegenTypes.WithDefault<CodegenTypes.Double, 0>;
  maxContentWidth?: CodegenTypes.WithDefault<CodegenTypes.Double, 0>;
  cornerRadius?: CodegenTypes.WithDefault<CodegenTypes.Double, -1>;
  elevation?: CodegenTypes.WithDefault<CodegenTypes.Double, -1>;

  // Color properties
  backgroundColor?: ColorValue;
  initialDetentIndex?: CodegenTypes.WithDefault<CodegenTypes.Int32, -1>;
  dimmedDetentIndex?: CodegenTypes.WithDefault<CodegenTypes.Int32, 0>;

  // String properties - use empty string as default to avoid nil insertion
  backgroundBlur?: CodegenTypes.WithDefault<
    | 'none'
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
    | 'system-chrome-material-dark',
    'none'
  >;

  placement?: CodegenTypes.WithDefault<
    'automatic' | 'leading' | 'center' | 'trailing',
    'automatic'
  >;
  placementOffset?: CodegenTypes.WithDefault<CodegenTypes.Double, 16>;
  insetAdjustment?: CodegenTypes.WithDefault<'automatic' | 'never', 'automatic'>;
  dismissThreshold?: CodegenTypes.WithDefault<'half' | 'short', 'half'>;

  // Boolean properties - match defaults from TrueSheet.types.ts
  grabber?: CodegenTypes.WithDefault<boolean, true>;
  grabberOptions?: GrabberOptionsType;
  accessibilityOptions?: AccessibilityOptionsType;
  dismissible?: CodegenTypes.WithDefault<boolean, true>;
  draggable?: CodegenTypes.WithDefault<boolean, true>;
  dimmed?: CodegenTypes.WithDefault<boolean, true>;
  initialDetentAnimated?: CodegenTypes.WithDefault<boolean, true>;
  // React tag of the scrollable component within the content (see scrollableRef)
  scrollableHandle?: CodegenTypes.WithDefault<CodegenTypes.Int32, -1>;
  scrollableOptions?: ScrollableOptionsType;
  headerOptions?: HeaderOptionsType;
  footerOptions?: FooterOptionsType;
  presentation?: CodegenTypes.WithDefault<'page' | 'form', 'page'>;

  // Event handlers
  onMount?: CodegenTypes.DirectEventHandler<null>;
  onWillPresent?: CodegenTypes.DirectEventHandler<DetentInfoEventPayload>;
  onDidPresent?: CodegenTypes.DirectEventHandler<DetentInfoEventPayload>;
  onWillDismiss?: CodegenTypes.DirectEventHandler<null>;
  onDidDismiss?: CodegenTypes.DirectEventHandler<null>;
  onDismissAttempt?: CodegenTypes.DirectEventHandler<null>;
  onDetentChange?: CodegenTypes.DirectEventHandler<DetentInfoEventPayload>;
  onDragBegin?: CodegenTypes.DirectEventHandler<DetentInfoEventPayload>;
  onDragChange?: CodegenTypes.DirectEventHandler<DetentInfoEventPayload>;
  onDragEnd?: CodegenTypes.DirectEventHandler<DetentInfoEventPayload>;
  onPositionChange?: CodegenTypes.DirectEventHandler<PositionChangeEventPayload>;
  onWillFocus?: CodegenTypes.DirectEventHandler<null>;
  onDidFocus?: CodegenTypes.DirectEventHandler<null>;
  onWillBlur?: CodegenTypes.DirectEventHandler<null>;
  onDidBlur?: CodegenTypes.DirectEventHandler<null>;
  onVisibilityChange?: CodegenTypes.DirectEventHandler<Readonly<{ visible: boolean }>>;
}

export default codegenNativeComponent<NativeProps>('TrueSheetView', {
  interfaceOnly: true,
});
