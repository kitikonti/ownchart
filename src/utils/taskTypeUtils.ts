/**
 * Utility functions for task type operations.
 */

import type { TaskType } from "../types/chart.types";

/** Cycle order for tasks without children: task → summary → milestone → task */
const CHILDLESS_CYCLE: readonly TaskType[] = ["task", "summary", "milestone"];

/**
 * Get the next task type in the cycling order.
 *
 * - With children: toggles between task ↔ summary (milestone not allowed with children)
 * - Without children: cycles task → summary → milestone → task
 *
 * @param currentType - The task's current type.
 * @param hasChildren - Whether the task currently has child tasks.
 * @returns The next `TaskType` in the applicable cycle.
 * @example
 * getNextTaskType("task", false)    // → "summary"
 * getNextTaskType("summary", true)  // → "task"
 */
export function getNextTaskType(
  currentType: TaskType,
  hasChildren: boolean
): TaskType {
  if (hasChildren) {
    // Milestone with children is invalid — always map to "task" so a task
    // with children toggles: task ↔ summary (milestone skipped).
    return currentType === "task" ? "summary" : "task";
  }

  // indexOf returns -1 for unknown types; (-1 + 1) % 3 = 0 → "task" (safe fallback).
  const index = CHILDLESS_CYCLE.indexOf(currentType);
  return CHILDLESS_CYCLE[(index + 1) % CHILDLESS_CYCLE.length];
}
