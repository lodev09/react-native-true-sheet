import { createContext, useContext, useEffect } from 'react';
import { View, type LayoutChangeEvent, type ViewProps } from 'react-native';

/**
 * Reports the measured peek content height to the owning TrueSheet.
 * @internal
 */
export const TrueSheetPeekContext = createContext<((height: number) => void) | null>(null);

/**
 * Wrapper component that marks its children as the sheet's peek content.
 * When rendered within a `TrueSheet`, its measured height is included in the
 * `"peek"` detent height (along with the `header` and `footer` heights).
 *
 * Place it at the top of the content - only its height is used, and the
 * sheet reveals content from the top when collapsed.
 */
export const TrueSheetPeek = ({ onLayout, ...rest }: ViewProps) => {
  const setPeekContentHeight = useContext(TrueSheetPeekContext);

  useEffect(() => () => setPeekContentHeight?.(0), [setPeekContentHeight]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setPeekContentHeight?.(event.nativeEvent.layout.height);
    onLayout?.(event);
  };

  return <View {...rest} onLayout={handleLayout} />;
};
