/**
 * Hook for creating new tasks from the placeholder row.
 * Extracts task creation logic (date calculation, order, addTask)
 * from NewTaskPlaceholderRow for testability and separation of concerns.
 */

import { useCallback } from "react";
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
      const lastTask = tasks.length > 0 ? tasks[tasks.length - 1] : null;

      const { startDate, endDate } = computeAppendDates(lastTask);
      const maxOrder =
        tasks.length > 0 ? Math.max(...tasks.map((t) => t.order)) + 1 : 0;

      addTask({
        name,
        startDate,
        endDate,
        duration: DEFAULT_TASK_DURATION,
        progress: 0,
        color: COLORS.chart.taskDefault,
        order: maxOrder,
        type: "task",
        parent: undefined,
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
 */
function computeAppendDates(lastTask: { endDate?: string } | null): {
  startDate: string;
  endDate: string;
} {
  if (lastTask?.endDate) {
    const lastEnd = new Date(lastTask.endDate);
    const start = new Date(lastEnd);
    start.setDate(lastEnd.getDate() + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + DEFAULT_TASK_DURATION - 1);
    return { startDate: toISODateString(start), endDate: toISODateString(end) };
  }

  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() + DEFAULT_TASK_DURATION - 1);
  return { startDate: toISODateString(today), endDate: toISODateString(end) };
}
