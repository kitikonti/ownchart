/**
 * Utility functions for collecting dependencies between tasks.
 * Used for copy/paste operations to preserve internal dependencies.
 */

import type { Task } from "../../types/chart.types";
import type { Dependency } from "../../types/dependency.types";

/**
 * Collect dependencies where BOTH tasks are in the set (internal dependencies).
 * External dependencies (where only one task is in the set) are excluded.
 *
 * @param tasks - Tasks to check dependencies for
 * @param allDependencies - Complete dependency list
 * @returns Array of internal dependencies only
 */
export function collectInternalDependencies(
  tasks: Task[],
  allDependencies: Dependency[]
): Dependency[] {
  const taskIds = new Set(tasks.map((t) => t.id));

  return allDependencies.filter(
    (dep) => taskIds.has(dep.fromTaskId) && taskIds.has(dep.toTaskId)
  );
}
