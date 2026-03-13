/**
 * useTaskStatistics - Computes aggregate task statistics for the status bar.
 *
 * Derives totalTasks, completedTasks, and overdueTasks in a single memoized
 * pass over the tasks array. Re-computes only when the tasks array changes.
 */

import { useMemo } from "react";
import { parseISO, startOfDay } from "date-fns";
import { useTaskStore } from "../store/slices/taskSlice";

export interface TaskStatistics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

/**
 * Computes task statistics for the status bar.
 * All three values are derived in a single memoized pass over the tasks array.
 */
export function useTaskStatistics(): TaskStatistics {
  const tasks = useTaskStore((state) => state.tasks);

  return useMemo((): TaskStatistics => {
    // "today" is captured at memo-invalidation time (i.e. when tasks change).
    // Known tradeoff: if the browser tab stays open across midnight, the overdue
    // count will be stale until the next task mutation. This is acceptable for a
    // status-bar display and avoids the complexity of a live-clock subscription
    // (e.g. a midnight-triggered useEffect). If this ever becomes a product
    // concern, a `useDateTick` hook that fires at midnight can invalidate the memo.
    const today = startOfDay(new Date());

    let completedTasks = 0;
    let overdueTasks = 0;

    for (const t of tasks) {
      if (t.progress === 100) {
        completedTasks++;
      } else {
        // Use parseISO (date-fns) to parse "YYYY-MM-DD" in local time, matching
        // the way toISODateString formats dates. new Date("YYYY-MM-DD") parses as
        // UTC midnight, which would cause "today" to appear overdue for users in
        // negative UTC-offset timezones. startOfDay normalises to midnight in
        // local time, consistent with the startOfDay call on today above.
        const parsed = parseISO(t.endDate);
        // Invalid dates (e.g. empty/malformed endDate) are treated as not overdue
        if (!isNaN(parsed.getTime()) && startOfDay(parsed) < today) {
          overdueTasks++;
        }
      }
    }

    return { totalTasks: tasks.length, completedTasks, overdueTasks };
  }, [tasks]);
}
