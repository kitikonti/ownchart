/** Minimum width for the task table panel in pixels */
export const MIN_TABLE_WIDTH = 200;

/** Reserve space for horizontal scrollbar (px) */
export const SCROLLBAR_HEIGHT = 17;

/**
 * Minimum overflow beyond container width (px).
 * Ensures timeline is always wider than container to guarantee horizontal
 * scrollbar, enabling infinite scroll in both directions.
 * Must be > 2 × THRESHOLD (100px) + initial scroll offset (~175px).
 */
export const MIN_OVERFLOW = 400;

/** Height of the timeline/table header row in pixels */
export const HEADER_HEIGHT = 48;

/** Extra rows beyond the task list (placeholder row for quick task creation) */
export const PLACEHOLDER_ROW_COUNT = 1;

// --- Infinite scroll constants ---

/** Milliseconds between infinite scroll extensions */
export const EXTEND_COOLDOWN_MS = 200;

/** Milliseconds to block infinite scroll after fitToView */
export const FIT_TO_VIEW_BLOCK_MS = 500;

/** Milliseconds to block infinite scroll after mount (wait for settings to load) */
export const INITIAL_BLOCK_MS = 1000;

/** Milliseconds to wait after scroll stops before extending left */
export const SCROLL_IDLE_MS = 150;

/** Pixels from edge to trigger infinite scroll extension */
export const INFINITE_SCROLL_THRESHOLD = 500;

/** Scroll position threshold for fitToView scroll lock (px) */
export const FIT_TO_VIEW_EDGE_THRESHOLD = 400;

/** Days to extend timeline per infinite scroll trigger */
export const EXTEND_DAYS = 30;

/** Minimum dimension in px to accept a measurement (below = DOM not ready) */
export const MIN_VALID_DIMENSION = 100;

/** Inline style to hide scrollbar on a scrollable element */
export const HIDDEN_SCROLLBAR_STYLE = {
  scrollbarWidth: "none" as const,
  msOverflowStyle: "none" as const,
};
