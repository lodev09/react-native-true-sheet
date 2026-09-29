export const TRANSITIONS = {
  DURATION: 0.5,
  EASE: [0.32, 0.72, 0, 1],
};

export const VELOCITY_THRESHOLD = 0.4;

export const DEFAULT_PEEK_HEIGHT = 150;

export const CLOSE_THRESHOLD = 0.25;

// Compose Material3 SheetState's dismiss thresholds, used by the 'short'
// dismiss threshold: velocity in px/ms, distance in px.
export const SHORT_DISMISS_VELOCITY = 0.125;
export const SHORT_DISMISS_DISTANCE = 56;

// Minimum downward pull (px) on a non-dismissible drawer at its first snap
// point before the release counts as a dismiss attempt.
export const DISMISS_ATTEMPT_THRESHOLD = 24;

export const SCROLL_LOCK_TIMEOUT = 100;

export const BORDER_RADIUS = 8;

export const NESTED_DISPLACEMENT = 16;

export const WINDOW_TOP_OFFSET = 26;

export const DRAG_CLASS = 'vaul-dragging';
