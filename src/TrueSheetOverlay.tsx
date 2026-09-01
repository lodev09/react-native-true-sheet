import { StyleSheet, type ViewProps } from 'react-native';

import TrueSheetOverlayViewNativeComponent from './fabric/TrueSheetOverlayViewNativeComponent';

/**
 * Renders its children in a native layer above every presented sheet — for
 * toasts, dialogs, and other content a sheet must not cover.
 * Fills the window; touches that miss its children pass through to the views beneath.
 */
export const TrueSheetOverlay = ({ style, ...rest }: ViewProps) => (
  <TrueSheetOverlayViewNativeComponent {...rest} style={[styles.overlay, style]} />
);

const styles = StyleSheet.create({
  // Sized to the window from native — absolute so it takes no layout space.
  // Children render in a native container, so the host itself must never
  // catch touches (Android forces it visible on layout).
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  },
});
