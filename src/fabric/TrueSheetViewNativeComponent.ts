import type { ViewProps } from 'react-native';
import type {
  DirectEventHandler,
  Double,
  Int32,
  WithDefault,
  Float,
} from 'react-native/Libraries/Types/CodegenTypes';
import { codegenNativeComponent } from 'react-native';

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
  detents?: ReadonlyArray<Float>;

  // Number properties - use 0 as default to avoid nil insertion
  maxHeight?: WithDefault<Double, 0>;
  background?: WithDefault<Int32, 0>;
  cornerRadius?: WithDefault<Double, -1>;
  initialDetentIndex?: WithDefault<Int32, -1>;
  dimmedDetentIndex?: WithDefault<Int32, 0>;

  // String properties - use empty string as default to avoid nil insertion
  blurTint?: WithDefault<string, ''>;
  keyboardMode?: WithDefault<'resize' | 'pan', 'resize'>;

  // Boolean properties - match defaults from TrueSheet.types.ts
  grabber?: WithDefault<boolean, true>;
  dismissible?: WithDefault<boolean, true>;
  dimmed?: WithDefault<boolean, true>;
  initialDetentAnimated?: WithDefault<boolean, true>;
  edgeToEdgeFullScreen?: WithDefault<boolean, false>;
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
}

export default codegenNativeComponent<NativeProps>('TrueSheetView', {
  interfaceOnly: true,
});
