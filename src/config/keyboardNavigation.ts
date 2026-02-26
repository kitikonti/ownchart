/**
 * Shared keyboard navigation constants for the task table grid.
 *
 * Used by Cell.tsx and NewTaskPlaceholderRow.tsx for arrow-key → direction mapping.
 */

import type { NavigationDirection } from "../types/task.types";

/** Arrow keys mapped to navigation directions for grid cell navigation. */
export const ARROW_NAV: Record<string, NavigationDirection> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};
