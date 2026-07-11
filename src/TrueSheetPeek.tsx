import type { ViewProps } from 'react-native';

import TrueSheetPeekViewNativeComponent from './fabric/TrueSheetPeekViewNativeComponent';

/**
 * Wrapper component that marks its children as the sheet's peek content.
 * When rendered within a `TrueSheet`, its measured height is included in the
 * `"peek"` detent height (along with the `header` and `footer` heights).
 */
export const TrueSheetPeek = (props: ViewProps) => <TrueSheetPeekViewNativeComponent {...props} />;
