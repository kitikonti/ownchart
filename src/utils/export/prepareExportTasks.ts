/**
 * Filter tasks for export rendering.
 * This is the SINGLE place where visibility filters are applied for exports.
 * When adding a new visibility feature (e.g. archived tasks), update THIS function.
 */

import type { Task } from "../../types/chart.types";
import type { TaskId } from "../../types/branded.types";

export function prepareExportTasks(
  tasks: ReadonlyArray<Task>,
  hiddenTaskIds: ReadonlyArray<TaskId>
): Task[] {
  if (hiddenTaskIds.length === 0) return [...tasks];
  const hiddenSet = new Set<TaskId>(hiddenTaskIds);
  return tasks.filter((t) => !hiddenSet.has(t.id));
}
