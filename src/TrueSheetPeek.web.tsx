import { createContext, type RefObject, useContext, useLayoutEffect, useRef } from 'react';
import { type LayoutChangeEvent, View, type ViewProps } from 'react-native';

/**
 * Registers a peek with the owning TrueSheet so it can measure the peek live.
 * @internal
 */
export interface TrueSheetPeekContextValue {
  contentRef: RefObject<View | null>;
  attachPeek: (view: View) => void;
  detachPeek: (view: View) => void;
  measurePeek: (view: View) => void;
}

export const TrueSheetPeekContext = createContext<TrueSheetPeekContextValue | null>(null);

/**
 * Distance from the top of the content view to the bottom of the peek view,
 * so the peek view's offset within the content (padding, views above it)
 * counts toward the peek detent. Both rects live in the drawer's transformed
 * subtree, so an in-flight translate cancels out of the delta. Rounded so the
 * sub-pixel noise of a mid-transition measurement doesn't register as a
 * change — the content re-measures every frame while the snap animates, and
 * a new value would restart the snap.
 * @internal
 */
export const measurePeekContentHeight = (
  peekElement: HTMLElement,
  contentElement: HTMLElement
): number =>
  Math.round(
    peekElement.getBoundingClientRect().bottom - contentElement.getBoundingClientRect().top
  );

/**
 * Wrapper component that marks its children as the sheet's peek content.
 * When rendered within a `TrueSheet`, the `"peek"` detent reveals everything
 * from the top of the sheet through the bottom of this component — content
 * below it stays hidden until the sheet is expanded.
 */
export const TrueSheetPeek = ({ onLayout, ...rest }: ViewProps) => {
  const context = useContext(TrueSheetPeekContext);
  const viewRef = useRef<View>(null);

  // Attach by instance rather than sharing a ref — during a screen swap the
  // incoming peek mounts before the outgoing one unmounts, and a shared ref
  // would be nulled by the outgoing unmount.
  useLayoutEffect(() => {
    const view = viewRef.current;
    if (!context || !view) return;

    context.attachPeek(view);
    return () => context.detachPeek(view);
  }, [context]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const view = viewRef.current;
    if (context && view) {
      context.measurePeek(view);
    }

    onLayout?.(event);
  };

  return <View {...rest} ref={viewRef} onLayout={handleLayout} />;
};
