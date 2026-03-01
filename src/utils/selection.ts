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
 */
export function findTopmostSelectedTaskId(
  tasks: Task[],
  selectedTaskIds: TaskId[]
): TaskId | null {
  if (selectedTaskIds.length === 0) return null;
  const collapsedIds = new Set(
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
