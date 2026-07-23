import type { ColorValue, ViewProps } from 'react-native';
import type { DirectEventHandler, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';
import { codegenNativeComponent } from 'react-native';

type SearchOptionsType = Readonly<{
  placeholder?: string;
  cancelText?: string;
  hideWhenScrolling?: WithDefault<boolean, true>;
  // Named uniquely — codegen derives the enum name from the field name
  searchPlacement?: WithDefault<'automatic' | 'inline' | 'stacked', 'stacked'>;
}>;

export interface SearchTextEventPayload {
  text: string;
}

export interface NativeProps extends ViewProps {
  title?: string;
  largeTitle?: WithDefault<boolean, false>;
  tintColor?: ColorValue;
  titleColor?: ColorValue;
  barColor?: ColorValue;
  separatorHidden?: WithDefault<boolean, false>;
  searchable?: WithDefault<boolean, false>;
  searchOptions?: SearchOptionsType;

  onSearchChange?: DirectEventHandler<SearchTextEventPayload>;
  onSearchSubmit?: DirectEventHandler<SearchTextEventPayload>;
  onSearchFocus?: DirectEventHandler<null>;
  onSearchBlur?: DirectEventHandler<null>;
  onSearchCancel?: DirectEventHandler<null>;
}

export default codegenNativeComponent<NativeProps>('TrueSheetNavBarView', {});
