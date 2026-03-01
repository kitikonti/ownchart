/**
 * Pure utility for computing the display representation of a task.
 * Extracted from TaskTableRow so it can be tested without React.
 */

import type { Task } from "../types/chart.types";
import { calculateSummaryDates } from "./hierarchy";
import { calculateDuration } from "./dateUtils";

/**
 * Compute the display-ready task, recalculating dates/duration as needed.
 *
 * - Summary tasks: dates are derived from children via `calculateSummaryDates`.
 *   Falls back to empty dates / duration 0 when no children have dates.
 * - Regular tasks with both dates: recalculates duration for consistency.
 * - Otherwise: returns the original task reference unchanged.
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
