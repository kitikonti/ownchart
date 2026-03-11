/**
 * Filter tasks for export rendering.
 * This is the SINGLE place where visibility filters are applied for exports.
 * When adding a new visibility feature (e.g. archived tasks), update THIS function.
 */

import type { Task } from "../../types/chart.types";
import type { TaskId } from "../../types/branded.types";

/**
 * Returns the subset of `tasks` that should appear in the export.
 *
 * @param tasks - The full flat task list from the store.
 * @param fullyResolvedHiddenTaskIds - IDs of tasks that must not appear in the
 *   export. **Contract**: the caller (chartSlice `hideTasks`) is responsible
 *   for including ALL descendants of a hidden parent in this array — not just
 *   the parent itself. This function performs a direct membership test only —
 *   it does NOT walk the hierarchy itself. If a child task is not present in
 *   `fullyResolvedHiddenTaskIds`, it will appear in the export even if its
 *   parent is hidden.
 *
 * @returns A new array containing only the tasks that are not in
 *   `fullyResolvedHiddenTaskIds`. Always returns a new array — never a
 *   reference to the input.
 *
 * @example
 * // CORRECT: pass both parent and all its descendants
 * prepareExportTasks(tasks, [parentId, child1Id, child2Id]);
 *
 * // INCORRECT: passing only the parent will leak child tasks into the export
 * prepareExportTasks(tasks, [parentId]); // child1 and child2 will still appear!
 */
export function prepareExportTasks(
  tasks: ReadonlyArray<Task>,
  fullyResolvedHiddenTaskIds: ReadonlyArray<TaskId>
): Task[] {
  // Fast path: no hidden tasks — return a fresh array without the overhead of
  // building a Set. Always returns a new array per the function's contract.
  if (fullyResolvedHiddenTaskIds.length === 0) return [...tasks];
  const hiddenSet = new Set<TaskId>(fullyResolvedHiddenTaskIds);
  return tasks.filter((t) => !hiddenSet.has(t.id));
}
