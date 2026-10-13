export type DrawerDirection = 'top' | 'bottom' | 'left' | 'right';
export interface SnapPoint {
  fraction: number;
  height: number;
}

export type AnyFunction = (...args: any) => any;

/**
 * The visual viewport while a soft keyboard shrinks it, in layout-viewport px.
 * `layoutHeight` is the full (keyboard-free) height.
 */
export interface KeyboardViewport {
  top: number;
  height: number;
  layoutHeight: number;
}
