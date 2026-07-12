import type { ViewProps } from 'react-native';

import TrueSheetPeekViewNativeComponent from './fabric/TrueSheetPeekViewNativeComponent';

/**
 * Wrapper component that marks its children as the sheet's peek content.
 * When rendered within a `TrueSheet`, the `"peek"` detent reveals everything
 * from the top of the sheet through the bottom of this component — content
 * below it stays hidden until the sheet is expanded.
 */
export const TrueSheetPeek = (props: ViewProps) => <TrueSheetPeekViewNativeComponent {...props} />;
