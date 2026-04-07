/**
 * Pure utility for computing the display representation of a task.
 * Extracted from TaskTableRow so it can be tested without React.
 */

import type { Task } from "@/types/chart.types";
import type { WorkingDaysConfig } from "@/types/preferences.types";
import { calculateSummaryDates } from "./hierarchy";
import { calculateDuration } from "./dateUtils";
import { calculateWorkingDays } from "./workingDaysCalculator";

/**
 * Working-days display context. When `mode` is true, `computeDisplayTask`
 * reports `duration` as the working-day count of the task's calendar span
 * (per parent epic #79, decision D5 — parent rollup also uses calendar-span
 * WD count, never sum of child WDs). When omitted or `mode` is false,
 * duration is calendar days.
 */
export interface WorkingDaysDisplayContext {
  mode: boolean;
  config: WorkingDaysConfig;
  region?: string;
}

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
 * @param wdContext - Optional working-days display context. When provided
 *   with `mode === true`, duration is reported as working days computed over
 *   the task's calendar span. Otherwise duration stays calendar-day based.
 */
export function computeDisplayTask(
  task: Task,
  tasks: Task[] | null,
  wdContext?: WorkingDaysDisplayContext
): Task {
  const useWd = wdContext?.mode === true;
  // Capture as a narrowed local so the closure below doesn't need non-null
  // assertions on `wdContext` after the guard.
  const wdConfig = useWd ? wdContext.config : undefined;
  const wdRegion = useWd ? wdContext.region : undefined;

  const computeDuration = (startDate: string, endDate: string): number =>
    wdConfig
      ? calculateWorkingDays(startDate, endDate, wdConfig, wdRegion)
      : calculateDuration(startDate, endDate);

  if (task.type === "summary" && tasks) {
    const summaryDates = calculateSummaryDates(tasks, task.id);
    if (summaryDates) {
      // D5: parent WD duration is the WD-count of the parent's calendar span,
      // not the sum of child WDs. `summaryDates.duration` is calendar-based;
      // recompute when WD mode is on.
      if (useWd && summaryDates.startDate && summaryDates.endDate) {
        return {
          ...task,
          ...summaryDates,
          duration: computeDuration(
            summaryDates.startDate,
            summaryDates.endDate
          ),
        };
      }
      return { ...task, ...summaryDates };
    }
    return { ...task, startDate: "", endDate: "", duration: 0 };
  }

  if (task.startDate && task.endDate) {
    return {
      ...task,
      duration: computeDuration(task.startDate, task.endDate),
    };
  }

  return task;
}
