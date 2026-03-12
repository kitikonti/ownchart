import { useMemo } from "react";
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
    // Statistics will drift after midnight until the next task mutation — this
    // is acceptable for a status-bar display and avoids a live-clock subscription.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let completedTasks = 0;
    let overdueTasks = 0;

    for (const t of tasks) {
      if (t.progress === 100) {
        completedTasks++;
      } else {
        const endDate = new Date(t.endDate);
        endDate.setHours(0, 0, 0, 0);
        // Invalid dates (e.g. empty/malformed endDate) are treated as not overdue
        if (!isNaN(endDate.getTime()) && endDate < today) {
          overdueTasks++;
        }
      }
    }

    return { totalTasks: tasks.length, completedTasks, overdueTasks };
  }, [tasks]);
}
