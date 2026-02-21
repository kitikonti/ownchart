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
