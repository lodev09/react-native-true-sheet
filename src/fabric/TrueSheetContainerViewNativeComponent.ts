import type { ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

export interface NativeProps extends ViewProps {
  // No props needed - container accesses props from parent TrueSheetView
}

// interfaceOnly: shadow node/state/descriptor are custom (common/cpp) so the
// container can fill the sheet when a ScrollView is pinned — its natural
// layout otherwise defines the auto detent height
export default codegenNativeComponent<NativeProps>('TrueSheetContainerView', {
  interfaceOnly: true,
});
