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
  // Portal target appended to the body so it stacks above the sheets' portal
  const [container] = useState(() =>
    typeof document !== 'undefined' ? document.createElement('div') : null
  );

  useLayoutEffect(() => {
    if (!container) return;

    container.style.cssText = 'position:fixed;inset:0;pointer-events:none';
    document.body.appendChild(container);
    return () => {
      container.remove();
    };
  }, [container]);

  if (!container) return null;

  return createPortal(
    <View pointerEvents="box-none" {...rest} style={[StyleSheet.absoluteFill, style]} />,
    container
  );
};
