/**
 * useComputedTaskColor - React hooks for computed task display colors
 *
 * Wraps the pure computeTaskColor logic (in utils/computeTaskColor.ts)
 * with React hooks for memoized, reactive usage in components.
 */

import { useMemo } from "react";
import { useChartStore } from "../store/slices/chartSlice";
import { useTaskStore } from "../store/slices/taskSlice";
import type { Task } from "../types/chart.types";
import {
  computeTaskColor,
  getComputedTaskColor,
} from "../utils/computeTaskColor";

// Re-export pure function for consumers that already import from this file
export { getComputedTaskColor };

/**
 * Hook to get computed color for a single task
 */
export function useComputedTaskColor(task: Task): string {
  const colorModeState = useChartStore((state) => state.colorModeState);
  const tasks = useTaskStore((state) => state.tasks);

  return useMemo(() => {
    return computeTaskColor(task, tasks, colorModeState);
  }, [task, tasks, colorModeState]);
}

/**
 * Hook to get computed colors for all tasks
 * Returns a Map from task ID to computed color
 */
export function useComputedTaskColors(): Map<string, string> {
  const colorModeState = useChartStore((state) => state.colorModeState);
  const tasks = useTaskStore((state) => state.tasks);

  return useMemo(() => {
    const colorMap = new Map<string, string>();

    tasks.forEach((task) => {
      const color = computeTaskColor(task, tasks, colorModeState);
      colorMap.set(task.id, color);
    });

    return colorMap;
  }, [tasks, colorModeState]);
}
