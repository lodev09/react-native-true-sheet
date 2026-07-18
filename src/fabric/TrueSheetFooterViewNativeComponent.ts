import type { ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

export interface NativeProps extends ViewProps {
  // Footer-specific props can be added here if needed
}

// interfaceOnly: shadow node/state/descriptor are custom (common/cpp) so the
// footer can absorb the sheet's bottom safe-area inset as padding
export default codegenNativeComponent<NativeProps>('TrueSheetFooterView', {
  interfaceOnly: true,
});
