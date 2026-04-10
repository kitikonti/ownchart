/**
 * Hook for creating new tasks (toolbar button and placeholder row).
 * Extracts task creation logic (date calculation, order, addTask)
 * for testability and separation of concerns.
 */

import { useCallback } from "react";
import { parseISO, addDays } from "date-fns";
import { useTaskStore } from "@/store/slices/taskSlice";
import { useChartStore } from "@/store/slices/chartSlice";
import { toISODateString, calculateDuration } from "@/utils/dateUtils";
import { COLORS } from "@/styles/design-tokens";
import { DEFAULT_TASK_DURATION } from "@/store/slices/taskSliceHelpers";
import { DEFAULT_TASK_TYPE } from "@/config/taskDefaults";
import { getWorkingDaysContext } from "@/store/selectors/workingDaysContextSelector";
import {
  snapForwardToWorkingDay,
  addWorkingDays as addWD,
  type WorkingDaysContext,
} from "@/utils/workingDaysCalculator";
import type { Task } from "@/types/chart.types";

interface UseNewTaskCreationReturn {
  createTask: (name: string) => void;
}

/**
 * Compute start/end/duration for a task appended after the latest-ending task.
 * Starts one day after that task's end date, or today if no tasks exist.
 *
 * When working-days mode is active, the start date is snapped forward to
 * the next working day and DEFAULT_TASK_DURATION is interpreted as working
 * days (e.g., 5 wd = Mon-Fri). Duration is always returned as calendar days
 * (storage contract).
 *
 * Uses date-fns parseISO + addDays throughout to avoid the UTC/local-time
 * mismatch that arises when mixing `new Date("YYYY-MM-DD")` (UTC midnight)
 * with `.getDate()` / `.setDate()` (local time). date-fns always operates
 * in local time, which matches the toISODateString (format) output.
 */
export function computeAppendDates(
  lastTask: { endDate?: string } | null,
  ctx?: WorkingDaysContext
): {
  startDate: string;
  endDate: string;
  duration: number;
} {
  let startStr: string;
  if (lastTask?.endDate) {
    startStr = toISODateString(addDays(parseISO(lastTask.endDate), 1));
  } else {
    startStr = toISODateString(new Date());
  }

  if (ctx?.enabled) {
    startStr = snapForwardToWorkingDay(startStr, ctx.config, ctx.holidayRegion);
    const endStr = addWD(
      startStr,
      DEFAULT_TASK_DURATION,
      ctx.config,
      ctx.holidayRegion
    );
    return {
      startDate: startStr,
      endDate: endStr,
      duration: calculateDuration(startStr, endStr),
    };
  }

  const endStr = toISODateString(
    addDays(parseISO(startStr), DEFAULT_TASK_DURATION - 1)
  );
  return {
    startDate: startStr,
    endDate: endStr,
    duration: DEFAULT_TASK_DURATION,
  };
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

      const wdCtx = getWorkingDaysContext();
      const { startDate, endDate, duration } = computeAppendDates(
        latestEndTask,
        wdCtx
      );

      addTask({
        name,
        startDate,
        endDate,
        duration,
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
