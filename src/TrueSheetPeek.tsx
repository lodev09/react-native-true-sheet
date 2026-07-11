import type { ViewProps } from 'react-native';

import TrueSheetPeekViewNativeComponent from './fabric/TrueSheetPeekViewNativeComponent';

/**
 * Wrapper component that marks its children as the sheet's peek content.
 * When rendered within a `TrueSheet`, its measured height is included in the
 * `"peek"` detent height (along with the `header` and `footer` heights).
 *
 * Place it at the top of the content - only its height is used, and the
 * sheet reveals content from the top when collapsed.
 */
export const TrueSheetPeek = (props: ViewProps) => <TrueSheetPeekViewNativeComponent {...props} />;
