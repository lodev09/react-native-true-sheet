import { createContext, type RefObject, useContext, useEffect, useRef } from 'react';
import { type LayoutChangeEvent, View, type ViewProps } from 'react-native';

/**
 * Reports the measured peek content height to the owning TrueSheet.
 * @internal
 */
export interface TrueSheetPeekContextValue {
  contentRef: RefObject<View | null>;
  peekRef: RefObject<View | null>;
  setPeekContentHeight: (height: number) => void;
}

export const TrueSheetPeekContext = createContext<TrueSheetPeekContextValue | null>(null);

/**
 * Distance from the top of the content view to the bottom of the peek view,
 * so the peek view's offset within the content (padding, views above it)
 * counts toward the peek detent. Both rects live in the drawer's transformed
 * subtree, so an in-flight translate cancels out of the delta.
 * @internal
 */
export const measurePeekContentHeight = (
  peekElement: HTMLElement,
  contentElement: HTMLElement
): number =>
  peekElement.getBoundingClientRect().bottom - contentElement.getBoundingClientRect().top;

/**
 * Wrapper component that marks its children as the sheet's peek content.
 * When rendered within a `TrueSheet`, the `"peek"` detent reveals everything
 * from the top of the sheet through the bottom of this component — content
 * below it stays hidden until the sheet is expanded.
 */
export const TrueSheetPeek = ({ onLayout, ...rest }: ViewProps) => {
  const context = useContext(TrueSheetPeekContext);
  const localRef = useRef<View>(null);

  // Register into the sheet's peek ref so it can measure the peek live
  // during detent geometry computation (state lags the first willPresent).
  const viewRef = context?.peekRef ?? localRef;

  useEffect(() => () => context?.setPeekContentHeight(0), [context]);

  const handleLayout = (event: LayoutChangeEvent) => {
    if (context) {
      // On web, View refs resolve to the underlying DOM elements.
      const peekElement = viewRef.current as unknown as HTMLElement | null;
      const contentElement = context.contentRef.current as unknown as HTMLElement | null;

      const bottom =
        peekElement && contentElement
          ? measurePeekContentHeight(peekElement, contentElement)
          : event.nativeEvent.layout.height;

      context.setPeekContentHeight(bottom);
    }

    onLayout?.(event);
  };

  return <View {...rest} ref={viewRef} onLayout={handleLayout} />;
};
