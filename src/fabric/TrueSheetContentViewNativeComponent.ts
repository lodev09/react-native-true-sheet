import type { HostComponent, ViewProps } from 'react-native'
import { codegenNativeComponent } from 'react-native'

export interface NativeProps extends ViewProps {
  // No props needed - size will be controlled by parent
}

export default codegenNativeComponent<NativeProps>(
  'TrueSheetContentView',
  {}
) as HostComponent<NativeProps>
