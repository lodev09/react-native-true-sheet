/// <reference lib="dom" />
import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { StyleSheet, View, type ViewProps } from 'react-native';

/**
 * Renders its children in a layer above every presented sheet — for
 * toasts, dialogs, and other content a sheet must not cover.
 * Fills the window; touches that miss its children pass through to the views beneath.
 */
export const TrueSheetOverlay = ({ style, ...rest }: ViewProps) => {
  // Portal target appended to the body so it stacks above the sheets' portal. Created once
  // mounted, so that the first render matches a server-rendered page, which has no portal.
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const element = document.createElement('div');
    element.style.cssText = 'position:fixed;inset:0;pointer-events:none';
    document.body.appendChild(element);
    setContainer(element);
    return () => {
      element.remove();
    };
  }, []);

  if (!container) return null;

  return createPortal(
    <View pointerEvents="box-none" {...rest} style={[StyleSheet.absoluteFill, style]} />,
    container
  );
};
