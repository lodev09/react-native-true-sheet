import type { ViewProps } from 'react-native';
import type { WithDefault } from 'react-native/Libraries/Types/CodegenTypes';
import { codegenNativeComponent } from 'react-native';

export interface NativeProps extends ViewProps {
  // Seeds the footer's first layout with the sheet's bottom safe-area inset
  // (insetAdjustment: 'automatic') so a late-set footer doesn't need a second
  // layout pass — and a visible sheet resize — once native pushes the inset
  autoBottomInset?: WithDefault<boolean, false>;
}

// interfaceOnly: shadow node/state/descriptor are custom (common/cpp) so the
// footer can absorb the sheet's bottom safe-area inset as padding
export default codegenNativeComponent<NativeProps>('TrueSheetFooterView', {
  interfaceOnly: true,
});
