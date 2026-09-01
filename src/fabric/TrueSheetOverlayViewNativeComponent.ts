import type { ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

export interface NativeProps extends ViewProps {
  // No props needed - sized to the window from native
}

// interfaceOnly: shadow node/state/descriptor are custom (common/cpp) so the
// overlay is sized to the window
export default codegenNativeComponent<NativeProps>('TrueSheetOverlayView', {
  interfaceOnly: true,
});
