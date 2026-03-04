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
import type { HexColor, TaskId } from "../types/branded.types";
import { computeTaskColor } from "../utils/computeTaskColor";

/**
 * Hook to get computed color for a single task.
 * Returns HexColor — computeTaskColor always produces hex strings.
 *
 * NOTE: Subscribes to the full task list, not just the given task.
 * This is required because color can depend on other tasks in certain modes
 * (e.g. parent color in Hierarchy mode, group color in Summary Group mode).
 */
export function useComputedTaskColor(task: Task): HexColor {
  const colorModeState = useChartStore((state) => state.colorModeState);
  // Full task list needed: color may depend on parent/siblings in Hierarchy
  // and Summary Group color modes, not just the task's own properties.
  const tasks = useTaskStore((state) => state.tasks);

  return useMemo(() => {
    return computeTaskColor(task, tasks, colorModeState);
  }, [task, tasks, colorModeState]);
}

/**
 * Hook to get computed colors for all tasks.
 * Returns a Map from task ID to computed HexColor.
 */
export function useComputedTaskColors(): Map<TaskId, HexColor> {
  const colorModeState = useChartStore((state) => state.colorModeState);
  const tasks = useTaskStore((state) => state.tasks);

  return useMemo(() => {
    const colorMap = new Map<TaskId, HexColor>();

    tasks.forEach((task) => {
      const color = computeTaskColor(task, tasks, colorModeState);
      colorMap.set(task.id, color);
    });

    return colorMap;
  }, [tasks, colorModeState]);
}
