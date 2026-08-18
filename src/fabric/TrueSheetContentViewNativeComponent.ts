import type { ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

export interface NativeProps extends ViewProps {
  // No props needed - size will be controlled by parent
}

// interfaceOnly: shadow node/state/descriptor are custom (common/cpp) so the
// content can be bounded to the container when a ScrollView is detected
export default codegenNativeComponent<NativeProps>('TrueSheetContentView', {
  interfaceOnly: true,
});
