/** Minimum width for the task table panel in pixels */
export const MIN_TABLE_WIDTH = 200;

/**
 * Reserve space for horizontal scrollbar (px).
 * 17 is the standard Windows/Chrome scrollbar height — may vary by OS/browser
 * but matches the most common desktop target for this app.
 */
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

/** CSS selector for the vertical scroll driver element (set by GanttLayout). */
export const SCROLL_DRIVER_SELECTOR = "[data-scroll-driver]";

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

/**
 * Delay (ms) before the initial dimension measurement in useContainerDimensions.
 * A value of 0 defers to the next macrotask so the browser has committed layout
 * before offsetHeight / offsetWidth are read. Must not be changed without
 * verifying that layout is stable at that point.
 */
export const INITIAL_MEASURE_DELAY_MS = 0;

/** Initial fallback viewport height (px) before the first ResizeObserver measurement */
export const INITIAL_VIEWPORT_HEIGHT = 600;

/** Initial fallback chart container width (px) before the first ResizeObserver measurement */
export const INITIAL_CHART_CONTAINER_WIDTH = 800;

/** Inline style to hide scrollbar on a scrollable element */
export const HIDDEN_SCROLLBAR_STYLE = {
  scrollbarWidth: "none",
  msOverflowStyle: "none",
} as const;

/**
 * Inline style to clip overflow on the Y axis.
 * `overflow-y: clip` is not yet available as a Tailwind utility class and
 * is intentionally distinct from `overflow-y: hidden` (clip does not
 * establish a new block-formatting context, preserving sticky positioning).
 */
export const OVERFLOW_Y_CLIP_STYLE = { overflowY: "clip" as const };
