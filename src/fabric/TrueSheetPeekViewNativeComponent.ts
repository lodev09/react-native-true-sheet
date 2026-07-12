import type { ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

export interface NativeProps extends ViewProps {
  // Peek-specific props can be added here if needed
}

export default codegenNativeComponent<NativeProps>('TrueSheetPeekView', {});
