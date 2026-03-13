/**
 * Hook for creating new tasks from the placeholder row.
 * Extracts task creation logic (date calculation, order, addTask)
 * from NewTaskPlaceholderRow for testability and separation of concerns.
 */

import { useCallback } from "react";
import { parseISO, addDays } from "date-fns";
import { useTaskStore } from "../store/slices/taskSlice";
import { toISODateString } from "../utils/dateUtils";
import { COLORS } from "../styles/design-tokens";
import { DEFAULT_TASK_DURATION } from "../store/slices/taskSliceHelpers";

interface UseNewTaskCreationReturn {
  createTask: (name: string) => void;
}

/**
 * Provides a `createTask(name)` function that appends a new task
 * after the last existing task, using shared constants and utilities.
 */
export function useNewTaskCreation(): UseNewTaskCreationReturn {
  const addTask = useTaskStore((state) => state.addTask);

  const createTask = useCallback(
    (name: string): void => {
      // Access tasks at call time (event handler), not during render
      const { tasks } = useTaskStore.getState();

      // Compute lastTask and maxOrder in a single pass to avoid iterating twice.
      // lastTask is the last element by array position (visual bottom of list),
      // which determines the start date for the new task. highestOrder tracks
      // the maximum order value (tasks may not be sorted by order) so the new
      // task is appended after all existing tasks regardless of their order values.
      let lastTask: { endDate?: string } | null = null;
      let highestOrder = -1;
      for (const t of tasks) {
        lastTask = t;
        if (t.order > highestOrder) highestOrder = t.order;
      }
      const maxOrder = tasks.length > 0 ? highestOrder + 1 : 0;

      const { startDate, endDate } = computeAppendDates(lastTask);

      addTask({
        name,
        startDate,
        endDate,
        duration: DEFAULT_TASK_DURATION,
        progress: 0,
        color: COLORS.chart.taskDefault,
        order: maxOrder,
        type: "task",
        metadata: {},
      });
    },
    [addTask]
  );

  return { createTask };
}

/**
 * Compute start/end dates for a task appended after the last task.
 * Starts one day after the last task's end date, or today if no tasks exist.
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
