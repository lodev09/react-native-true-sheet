import type { HostComponent, ViewProps } from 'react-native'
import type {
  DirectEventHandler,
  Double,
  Int32,
  WithDefault,
} from 'react-native/Libraries/Types/CodegenTypes'
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent'

export interface DetentInfo {
  index: Int32
  position: Double
}

type PositionChangeEventPayload = DetentInfo & { transitioning: boolean }

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
  onMount?: DirectEventHandler<{}>
  onWillPresent?: DirectEventHandler<DetentInfo>
  onDidPresent?: DirectEventHandler<DetentInfo>
  onWillDismiss?: DirectEventHandler<{}>
  onDidDismiss?: DirectEventHandler<{}>
  onDetentChange?: DirectEventHandler<DetentInfo>
  onDragBegin?: DirectEventHandler<DetentInfo>
  onDragChange?: DirectEventHandler<DetentInfo>
  onDragEnd?: DirectEventHandler<DetentInfo>
  onPositionChange?: DirectEventHandler<PositionChangeEventPayload>
}

export default codegenNativeComponent<NativeProps>('TrueSheetView', {
  excludedPlatforms: ['android'],
  interfaceOnly: false,
}) as HostComponent<NativeProps>
