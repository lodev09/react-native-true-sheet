import type { HostComponent, ViewProps } from 'react-native'
import type {
  DirectEventHandler,
  Double,
  Int32,
  WithDefault,
} from 'react-native/Libraries/Types/CodegenTypes'
import { codegenNativeComponent } from 'react-native'

export interface DetentInfoEventPayload {
  index: Int32
  position: Double
}

export interface PositionChangeEventPayload {
  index: Int32
  position: Double
  transitioning: boolean
}

export interface NativeProps extends ViewProps {
  // Array properties
  detents?: ReadonlyArray<number>

  // Number properties - use 0 as default to avoid nil insertion
  maxHeight?: WithDefault<Double, 0>
  background?: WithDefault<Int32, 0>
  cornerRadius?: WithDefault<Double, -1>
  contentHeight?: WithDefault<Double, 0>
  footerHeight?: WithDefault<Double, 0>
  initialIndex?: WithDefault<Int32, -1>
  dimmedIndex?: WithDefault<Int32, 0>

  // String properties - use empty string as default to avoid nil insertion
  blurTint?: WithDefault<string, ''>
  keyboardMode?: WithDefault<'resize' | 'pan', 'resize'>

  // Boolean properties - match defaults from TrueSheet.types.ts
  grabber?: WithDefault<boolean, true>
  dismissible?: WithDefault<boolean, true>
  dimmed?: WithDefault<boolean, true>
  initialIndexAnimated?: WithDefault<boolean, true>
  edgeToEdge?: WithDefault<boolean, false>

  // Event handlers
  onMount?: DirectEventHandler<null>
  onWillPresent?: DirectEventHandler<DetentInfoEventPayload>
  onDidPresent?: DirectEventHandler<DetentInfoEventPayload>
  onWillDismiss?: DirectEventHandler<null>
  onDidDismiss?: DirectEventHandler<null>
  onDetentChange?: DirectEventHandler<DetentInfoEventPayload>
  onDragBegin?: DirectEventHandler<DetentInfoEventPayload>
  onDragChange?: DirectEventHandler<DetentInfoEventPayload>
  onDragEnd?: DirectEventHandler<DetentInfoEventPayload>
  onPositionChange?: DirectEventHandler<PositionChangeEventPayload>
}

export default codegenNativeComponent<NativeProps>('TrueSheetView', {
  excludedPlatforms: ['android'],
  interfaceOnly: false,
}) as HostComponent<NativeProps>
