/**
 * Shared keyboard navigation constants for the task table grid.
 *
 * Used by Cell.tsx and NewTaskPlaceholderRow.tsx for arrow-key → direction mapping.
 */

import type { NavigationDirection } from "@/types/task.types";

/**
 * Arrow keys mapped to navigation directions for grid cell navigation.
 *
 * The explicit `Record<string, NavigationDirection>` type allows callers to
 * index with `e.key` (a plain `string`) and receive `NavigationDirection | undefined`.
 * The `satisfies` clause validates at compile time that all four arrow key entries
 * are present and correctly typed — these two annotations serve different purposes.
 */
export const ARROW_NAV: Record<string, NavigationDirection> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
} satisfies Record<
  "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight",
  NavigationDirection
>;
