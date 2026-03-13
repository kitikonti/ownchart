/**
 * Pure utility for computing the display representation of a task.
 * Extracted from TaskTableRow so it can be tested without React.
 */

import type { Task } from "@/types/chart.types";
import { calculateSummaryDates } from "./hierarchy";
import { calculateDuration } from "./dateUtils";

/**
 * Compute the display-ready task, recalculating dates/duration as needed.
 *
 * - Summary tasks: dates are derived from children via `calculateSummaryDates`.
 *   Falls back to the original task reference unchanged when `tasks` is null
 *   (e.g. when the caller does not have access to the full task list).
 *   Falls back to empty dates / duration 0 when `tasks` is provided but no
 *   children have dates.
 * - Regular tasks with both dates: recalculates duration for consistency.
 *   `tasks` is not used for non-summary tasks and may be null.
 * - Otherwise: returns the original task reference unchanged.
 *
 * @param task  - The task to compute a display representation for.
 * @param tasks - Full task list required for summary date derivation.
 *   Pass `null` when only non-summary tasks are being processed, or when the
 *   full list is unavailable (summary falls back to returning `task` unchanged).
 */
export function computeDisplayTask(task: Task, tasks: Task[] | null): Task {
  if (task.type === "summary" && tasks) {
    const summaryDates = calculateSummaryDates(tasks, task.id);
    if (summaryDates) {
      return { ...task, ...summaryDates };
    }
    return { ...task, startDate: "", endDate: "", duration: 0 };
  }

  if (task.startDate && task.endDate) {
    return {
      ...task,
      duration: calculateDuration(task.startDate, task.endDate),
    };
  }

  return task;
}
