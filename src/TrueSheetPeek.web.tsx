import { createContext, useContext, useEffect, useRef, type RefObject } from 'react';
import { View, type LayoutChangeEvent, type ViewProps } from 'react-native';

/**
 * Reports the measured peek content height to the owning TrueSheet.
 * @internal
 */
export interface TrueSheetPeekContextValue {
  contentRef: RefObject<View | null>;
  setPeekContentHeight: (height: number) => void;
}

export const TrueSheetPeekContext = createContext<TrueSheetPeekContextValue | null>(null);

/**
 * Wrapper component that marks its children as the sheet's peek content.
 * When rendered within a `TrueSheet`, the `"peek"` detent reveals everything
 * from the top of the sheet through the bottom of this component — content
 * below it stays hidden until the sheet is expanded.
 */
export const TrueSheetPeek = ({ onLayout, ...rest }: ViewProps) => {
  const context = useContext(TrueSheetPeekContext);
  const viewRef = useRef<View>(null);

  useEffect(() => () => context?.setPeekContentHeight(0), [context]);

  const handleLayout = (event: LayoutChangeEvent) => {
    if (context) {
      // On web, View refs resolve to the underlying DOM elements.
      const peekElement = viewRef.current as unknown as HTMLElement | null;
      const contentElement = context.contentRef.current as unknown as HTMLElement | null;

      // Distance from the top of the content view to the bottom of the peek view,
      // so the peek view's offset within the content (padding, views above it)
      // counts toward the peek detent.
      const bottom =
        peekElement && contentElement
          ? peekElement.getBoundingClientRect().bottom - contentElement.getBoundingClientRect().top
          : event.nativeEvent.layout.height;

      context.setPeekContentHeight(bottom);
    }

    onLayout?.(event);
  };

  return <View {...rest} ref={viewRef} onLayout={handleLayout} />;
};
