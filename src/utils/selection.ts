/**
 * Selection utilities for task operations.
 */

import { buildFlattenedTaskList } from "./hierarchy";
import type { Task } from "../types/chart.types";
import type { TaskId } from "../types/branded.types";

/**
 * Returns the id of the first task (in visual/flattened order) that appears
 * in the given selection. Collapsed subtrees are excluded, matching the same
 * logic used for drag-insert reference-point selection.
 *
 * Returns null when the selection is empty or none of the selected tasks are
 * currently visible in the flattened list.
 *
 * @param prebuiltCollapsedIds - Optional pre-built set of collapsed task IDs.
 *   Pass this when the caller already has the collapsed-ID set to avoid
 *   rebuilding it on every call (e.g. during drag operations).
 *   When omitted, the set is derived from `tasks` automatically.
 */
export function findTopmostSelectedTaskId(
  tasks: Task[],
  selectedTaskIds: TaskId[],
  prebuiltCollapsedIds?: Set<TaskId>
): TaskId | null {
  if (selectedTaskIds.length === 0) return null;
  const collapsedIds =
    prebuiltCollapsedIds ??
    new Set(
      // t.open === undefined is treated as open (not collapsed)
      tasks.filter((t) => t.open === false).map((t) => t.id)
    );
  const flatList = buildFlattenedTaskList(tasks, collapsedIds);
  const selectedSet = new Set(selectedTaskIds);
  for (const ft of flatList) {
    if (selectedSet.has(ft.task.id)) {
      return ft.task.id;
    }
  }
  return null;
}
