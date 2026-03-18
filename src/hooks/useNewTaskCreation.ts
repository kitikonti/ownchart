/**
 * Hook for creating new tasks (toolbar button and placeholder row).
 * Extracts task creation logic (date calculation, order, addTask)
 * for testability and separation of concerns.
 */

import { useCallback } from "react";
import { parseISO, addDays } from "date-fns";
import { useTaskStore } from "@/store/slices/taskSlice";
import { useChartStore } from "@/store/slices/chartSlice";
import { toISODateString } from "@/utils/dateUtils";
import { COLORS } from "@/styles/design-tokens";
import { DEFAULT_TASK_DURATION } from "@/store/slices/taskSliceHelpers";
import { DEFAULT_TASK_TYPE } from "@/config/taskDefaults";
import type { Task } from "@/types/chart.types";

interface UseNewTaskCreationReturn {
  createTask: (name: string) => void;
}

/**
 * Compute start/end dates for a task appended after the latest-ending task.
 * Starts one day after that task's end date, or today if no tasks exist.
 *
 * Uses date-fns parseISO + addDays throughout to avoid the UTC/local-time
 * mismatch that arises when mixing `new Date("YYYY-MM-DD")` (UTC midnight)
 * with `.getDate()` / `.setDate()` (local time). date-fns always operates
 * in local time, which matches the toISODateString (format) output.
 */
function computeAppendDates(lastTask: { endDate?: string } | null): {
  startDate: string;
  endDate: string;
} {
  if (lastTask?.endDate) {
    const start = addDays(parseISO(lastTask.endDate), 1);
    const end = addDays(start, DEFAULT_TASK_DURATION - 1);
    return { startDate: toISODateString(start), endDate: toISODateString(end) };
  }

  const today = new Date();
  const end = addDays(today, DEFAULT_TASK_DURATION - 1);
  return { startDate: toISODateString(today), endDate: toISODateString(end) };
}

/**
 * Provides a `createTask(name)` function that appends a new task
 * after the latest-ending existing task, using shared constants and utilities.
 */
export function useNewTaskCreation(): UseNewTaskCreationReturn {
  const addTask = useTaskStore((state) => state.addTask);

  const createTask = useCallback(
    (name: string): void => {
      // Access tasks at call time (event handler), not during render
      const { tasks } = useTaskStore.getState();

      // Find the task with the latest endDate and the highest order value
      // in a single pass. The latest-ending task determines the start date
      // for the new task (so it never overlaps existing tasks), while
      // highestOrder ensures the new task is appended after all others.
      let latestEndTask: Task | null = null;
      let highestOrder = -1;
      for (const t of tasks) {
        if (
          !latestEndTask ||
          (t.endDate && t.endDate > (latestEndTask.endDate ?? ""))
        ) {
          latestEndTask = t;
        }
        if (t.order > highestOrder) highestOrder = t.order;
      }
      const nextOrder = tasks.length > 0 ? highestOrder + 1 : 0;

      const { startDate, endDate } = computeAppendDates(latestEndTask);

      addTask({
        name,
        startDate,
        endDate,
        duration: DEFAULT_TASK_DURATION,
        progress: 0,
        color: COLORS.chart.taskDefault,
        order: nextOrder,
        type: DEFAULT_TASK_TYPE,
        metadata: {},
      });

      // Ensure the new task is visible in the timeline.
      // If the user scrolled away from the task's date range, the timeline
      // will scroll to show the task without changing the zoom level.
      useChartStore.getState().requestScrollToDate(startDate);
    },
    [addTask]
  );

  return { createTask };
}
