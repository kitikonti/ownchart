/**
 * Utility functions for task type operations.
 */

import type { TaskType } from "../types/chart.types";

/** Cycle order for tasks without children: task → summary → milestone → task */
const CHILDLESS_CYCLE: readonly TaskType[] = ["task", "summary", "milestone"];

/**
 * Get the next task type in the cycling order.
 *
 * - With children: toggles between task ↔ summary (milestone not allowed)
 * - Without children: cycles task → summary → milestone → task
 */
export function getNextTaskType(
  currentType: TaskType,
  hasChildren: boolean
): TaskType {
  if (hasChildren) {
    return currentType === "task" ? "summary" : "task";
  }

  const index = CHILDLESS_CYCLE.indexOf(currentType);
  return CHILDLESS_CYCLE[(index + 1) % CHILDLESS_CYCLE.length];
}
