import type { ViewProps } from 'react-native';
import type { WithDefault } from 'react-native/Libraries/Types/CodegenTypes';
import { codegenNativeComponent } from 'react-native';

export interface NativeProps extends ViewProps {
  // Named uniquely — codegen derives the enum name from the field name
  slotType?: WithDefault<'left' | 'right' | 'title', 'left'>;
}

export default codegenNativeComponent<NativeProps>('TrueSheetNavBarItemView', {});
