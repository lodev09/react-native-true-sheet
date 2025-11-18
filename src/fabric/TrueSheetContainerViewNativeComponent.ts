import type { HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

export interface NativeProps extends ViewProps {
  // No props needed - container accesses props from parent TrueSheetView
}

export default codegenNativeComponent<NativeProps>(
  'TrueSheetContainerView',
  {}
) as HostComponent<NativeProps>;
