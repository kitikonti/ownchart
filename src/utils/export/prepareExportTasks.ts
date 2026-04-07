/**
 * Filter and transform tasks for export rendering.
 * This is the SINGLE place where visibility filters and export-time task
 * transforms are applied. When adding a new visibility feature (e.g. archived
 * tasks) or a new mode-dependent transform, update THIS function.
 */

import type { Task } from "@/types/chart.types";
import type { TaskId } from "@/types/branded.types";
import type { WorkingDaysConfig } from "@/types/preferences.types";
import { calculateWorkingDays } from "@/utils/workingDaysCalculator";

/**
 * Optional cross-cutting context for export-time transforms. Each field is
 * independent — pass only what applies. New transform inputs (e.g. archived
 * filtering) should be added here rather than at every call site.
 */
export interface PrepareExportTasksContext {
  /**
   * When provided with `mode === true`, each task's `duration` is overridden
   * with the working-day count of its calendar span (calendar days otherwise,
   * unchanged from storage). Milestone tasks and tasks without both dates
   * keep their original duration.
   */
  workingDays?: {
    mode: boolean;
    config: WorkingDaysConfig;
    region?: string;
  };
}

/**
 * Returns the subset of `tasks` that should appear in the export, with any
 * mode-dependent transforms applied.
 *
 * @param tasks - The full flat task list from the store.
 * @param fullyResolvedHiddenTaskIds - IDs of tasks that must not appear in the
 *   export. **Contract**: the caller (chartSlice `hideTasks`) is responsible
 *   for including ALL descendants of a hidden parent in this array — not just
 *   the parent itself. This function performs a direct membership test only —
 *   it does NOT walk the hierarchy itself. If a child task is not present in
 *   `fullyResolvedHiddenTaskIds`, it will appear in the export even if its
 *   parent is hidden.
 * @param context - Optional cross-cutting transform context (e.g. working
 *   days override). Omit for a pure visibility filter.
 *
 * @returns A mutable `Task[]` containing only the tasks that are not in
 *   `fullyResolvedHiddenTaskIds`. Always a new array — never a reference to
 *   the input (callers may sort/mutate the result). The new-array guarantee
 *   exists so that callers (e.g. React state comparisons) can rely on
 *   reference inequality to detect changes, even when no tasks are hidden.
 *
 * @example
 * // CORRECT: pass both parent and all its descendants
 * prepareExportTasks(tasks, [toTaskId(parentId), toTaskId(child1Id), toTaskId(child2Id)]);
 *
 * // INCORRECT: passing only the parent will leak child tasks into the export
 * prepareExportTasks(tasks, [toTaskId(parentId)]); // child1 and child2 will still appear!
 */
export function prepareExportTasks(
  tasks: ReadonlyArray<Task>,
  fullyResolvedHiddenTaskIds: ReadonlyArray<TaskId>,
  context: PrepareExportTasksContext = {}
): Task[] {
  // Phase 1: visibility filter. Fast path skips Set construction when nothing
  // is hidden, while still honouring the "always returns a new array" contract.
  const hiddenSet =
    fullyResolvedHiddenTaskIds.length === 0
      ? null
      : new Set<TaskId>(fullyResolvedHiddenTaskIds);
  const filtered = hiddenSet
    ? tasks.filter((t) => !hiddenSet.has(t.id))
    : [...tasks];

  // Phase 2: mode-dependent transforms. Each transform is independent and
  // operates on the already-filtered list. Skip the map allocation entirely
  // when no transform applies.
  const wd = context.workingDays;
  const wdActive = wd?.mode === true;
  if (!wdActive) return filtered;

  return filtered.map((task) => {
    if (task.type === "milestone" || !task.startDate || !task.endDate) {
      return task;
    }
    return {
      ...task,
      duration: calculateWorkingDays(
        task.startDate,
        task.endDate,
        wd.config,
        wd.region
      ),
    };
  });
}
