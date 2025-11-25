import type { ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

export interface NativeProps extends ViewProps {
  // Header-specific props can be added here if needed
}

export default codegenNativeComponent<NativeProps>('TrueSheetHeaderView', {});
