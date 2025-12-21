import type { ColorValue, ProcessedColorValue, ViewProps } from 'react-native';
import type {
  DirectEventHandler,
  Double,
  Int32,
  WithDefault,
} from 'react-native/Libraries/Types/CodegenTypes';
import { codegenNativeComponent } from 'react-native';

type GrabberOptionsType = Readonly<{
  width?: Double;
  height?: Double;
  topMargin?: Double;
  cornerRadius?: WithDefault<Double, -1>;
  color?: ProcessedColorValue | null;
  adaptive?: WithDefault<boolean, true>;
}>;

type BlurOptionsType = Readonly<{
  intensity?: WithDefault<Double, -1>;
  interaction?: WithDefault<boolean, true>;
}>;

export interface DetentInfoEventPayload {
  index: Int32;
  position: Double;
  detent: Double;
}

export interface PositionChangeEventPayload {
  index: Double;
  position: Double;
  detent: Double;
  realtime: boolean;
}

export interface NativeProps extends ViewProps {
  // Array properties
  detents?: ReadonlyArray<Double>;

  // Number properties - use 0 as default to avoid nil insertion
  maxHeight?: WithDefault<Double, 0>;
  cornerRadius?: WithDefault<Double, -1>;

  // Color properties
  backgroundColor?: ColorValue;
  initialDetentIndex?: WithDefault<Int32, -1>;
  dimmedDetentIndex?: WithDefault<Int32, 0>;

  // String properties - use empty string as default to avoid nil insertion
  blurTint?: WithDefault<string, ''>;

  insetAdjustment?: WithDefault<'automatic' | 'never', 'automatic'>;

  // Blur options
  blurOptions?: BlurOptionsType;

  // Boolean properties - match defaults from TrueSheet.types.ts
  grabber?: WithDefault<boolean, true>;
  grabberOptions?: GrabberOptionsType;
  dismissible?: WithDefault<boolean, true>;
  draggable?: WithDefault<boolean, true>;
  dimmed?: WithDefault<boolean, true>;
  initialDetentAnimated?: WithDefault<boolean, true>;
  scrollable?: WithDefault<boolean, false>;
  pageSizing?: WithDefault<boolean, true>;

  // Event handlers
  onMount?: DirectEventHandler<null>;
  onWillPresent?: DirectEventHandler<DetentInfoEventPayload>;
  onDidPresent?: DirectEventHandler<DetentInfoEventPayload>;
  onWillDismiss?: DirectEventHandler<null>;
  onDidDismiss?: DirectEventHandler<null>;
  onDetentChange?: DirectEventHandler<DetentInfoEventPayload>;
  onDragBegin?: DirectEventHandler<DetentInfoEventPayload>;
  onDragChange?: DirectEventHandler<DetentInfoEventPayload>;
  onDragEnd?: DirectEventHandler<DetentInfoEventPayload>;
  onPositionChange?: DirectEventHandler<PositionChangeEventPayload>;
  onWillFocus?: DirectEventHandler<null>;
  onDidFocus?: DirectEventHandler<null>;
  onWillBlur?: DirectEventHandler<null>;
  onDidBlur?: DirectEventHandler<null>;
  onBackPress?: DirectEventHandler<null>;
}

export default codegenNativeComponent<NativeProps>('TrueSheetView', {
  interfaceOnly: true,
});
