import type { HostComponent, ViewProps } from 'react-native'
import type {
  DirectEventHandler,
  Double,
  Int32,
  WithDefault,
} from 'react-native/Libraries/Types/CodegenTypes'
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent'
import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands'

export interface SizeInfo {
  index: Int32
  value: Double
}

export interface ContainerSize {
  width: Double
  height: Double
}

export interface NativeProps extends ViewProps {
  // Array properties
  sizes?: ReadonlyArray<string>

  // Number properties
  scrollableHandle?: WithDefault<Int32, null>
  maxHeight?: WithDefault<Double, null>
  background?: WithDefault<Int32, null>
  cornerRadius?: WithDefault<Double, null>
  contentHeight?: WithDefault<Double, null>
  footerHeight?: WithDefault<Double, null>
  initialIndex?: WithDefault<Int32, -1>
  dimmedIndex?: WithDefault<Int32, null>

  // String properties
  blurTint?: WithDefault<string, null>
  keyboardMode?: WithDefault<'resize' | 'pan', 'resize'>

  // Boolean properties
  grabber?: WithDefault<boolean, true>
  dismissible?: WithDefault<boolean, true>
  dimmed?: WithDefault<boolean, true>
  initialIndexAnimated?: WithDefault<boolean, true>
  edgeToEdge?: WithDefault<boolean, false>

  // Event handlers
  onMount?: DirectEventHandler<null>
  onPresent?: DirectEventHandler<SizeInfo>
  onDismiss?: DirectEventHandler<null>
  onSizeChange?: DirectEventHandler<SizeInfo>
  onDragBegin?: DirectEventHandler<SizeInfo>
  onDragChange?: DirectEventHandler<SizeInfo>
  onDragEnd?: DirectEventHandler<SizeInfo>
  onContainerSizeChange?: DirectEventHandler<ContainerSize>
}

export interface NativeCommands {
  present: (viewRef: React.ElementRef<HostComponent<NativeProps>>, index: Int32) => void
  dismiss: (viewRef: React.ElementRef<HostComponent<NativeProps>>) => void
}

export const Commands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['present', 'dismiss'],
})

export default codegenNativeComponent<NativeProps>('TrueSheetView', {
  excludedPlatforms: ['android'],
  interfaceOnly: false,
}) as HostComponent<NativeProps>
