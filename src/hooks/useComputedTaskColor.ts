/**
 * useComputedTaskColor - Compute display color based on color mode
 *
 * Returns the appropriate color for a task based on the current color mode:
 * - Manual: Returns task.color directly
 * - Theme: Returns color from selected palette (cyclic distribution)
 * - Summary: Returns parent's color (or own color if root)
 * - Task Type: Returns color based on task type
 * - Hierarchy: Returns lightened color based on depth level
 */

import { useMemo } from "react";
import { useChartStore } from "../store/slices/chartSlice";
import { useTaskStore } from "../store/slices/taskSlice";
import type { Task } from "../types/chart.types";
import type { ColorModeState } from "../types/colorMode.types";
import { getPaletteById } from "../utils/colorPalettes";
import {
  expandPalette,
  generateMonochromePalette,
  lightenColor,
} from "../utils/colorUtils";

/**
 * Get the hierarchy depth of a task
 */
function getTaskDepth(task: Task, allTasks: Task[]): number {
  let depth = 0;
  let currentTask: Task | undefined = task;

  while (currentTask?.parent) {
    depth++;
    currentTask = allTasks.find((t) => t.id === currentTask?.parent);
  }

  return depth;
}

/**
 * Get the nearest summary parent of a task
 */
function getNearestSummaryParent(
  task: Task,
  allTasks: Task[]
): Task | undefined {
  if (!task.parent) return undefined;

  const parent = allTasks.find((t) => t.id === task.parent);
  if (!parent) return undefined;

  if (parent.type === "summary") {
    return parent;
  }

  // Recursively check parent's parent
  return getNearestSummaryParent(parent, allTasks);
}

/**
 * Compute the display color for a task based on color mode
 */
function computeTaskColor(
  task: Task,
  allTasks: Task[],
  colorModeState: ColorModeState,
  taskIndex: number
): string {
  const {
    mode,
    themeOptions,
    summaryOptions,
    taskTypeOptions,
    hierarchyOptions,
  } = colorModeState;

  // Check for manual override (if task has colorOverride flag)
  // For now we check if the task has a custom color different from defaults
  // TODO: Add colorOverride field to Task interface for explicit tracking

  switch (mode) {
    case "manual":
      // In manual mode, always use task's own color
      return task.color;

    case "theme": {
      // Get the active palette
      let paletteColors: string[] = [];

      if (themeOptions.customMonochromeBase) {
        // Use custom monochrome palette
        paletteColors = generateMonochromePalette(
          themeOptions.customMonochromeBase
        );
      } else if (themeOptions.selectedPaletteId) {
        const palette = getPaletteById(themeOptions.selectedPaletteId);
        if (palette) {
          paletteColors = palette.colors;
        }
      }

      if (paletteColors.length === 0) {
        // Fallback to task's own color if no palette selected
        return task.color;
      }

      // Expand palette if needed and get color by task index
      const expandedPalette = expandPalette(paletteColors, allTasks.length);
      return expandedPalette[taskIndex % expandedPalette.length];
    }

    case "summary": {
      // Check if this is a milestone and should use accent color
      if (task.type === "milestone" && summaryOptions.useMilestoneAccent) {
        return summaryOptions.milestoneAccentColor;
      }

      // Find the nearest summary parent
      const summaryParent = getNearestSummaryParent(task, allTasks);
      if (summaryParent) {
        return summaryParent.color;
      }

      // Root level tasks keep their own color
      return task.color;
    }

    case "taskType": {
      // Return color based on task type
      switch (task.type) {
        case "summary":
          return taskTypeOptions.summaryColor;
        case "milestone":
          return taskTypeOptions.milestoneColor;
        case "task":
        default:
          return taskTypeOptions.taskColor;
      }
    }

    case "hierarchy": {
      // Calculate depth and apply lightening
      const depth = getTaskDepth(task, allTasks);
      const lightenAmount = Math.min(
        depth * (hierarchyOptions.lightenPercentPerLevel / 100),
        hierarchyOptions.maxLightenPercent / 100
      );

      return lightenColor(hierarchyOptions.baseColor, lightenAmount);
    }

    default:
      return task.color;
  }
}

/**
 * Hook to get computed color for a single task
 */
export function useComputedTaskColor(task: Task): string {
  const colorModeState = useChartStore((state) => state.colorModeState);
  const tasks = useTaskStore((state) => state.tasks);

  return useMemo(() => {
    const taskIndex = tasks.findIndex((t) => t.id === task.id);
    return computeTaskColor(task, tasks, colorModeState, taskIndex);
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

    tasks.forEach((task, index) => {
      const color = computeTaskColor(task, tasks, colorModeState, index);
      colorMap.set(task.id, color);
    });

    return colorMap;
  }, [tasks, colorModeState]);
}

/**
 * Get computed color without hooks (for use in non-component contexts)
 */
export function getComputedTaskColor(
  task: Task,
  allTasks: Task[],
  colorModeState: ColorModeState
): string {
  const taskIndex = allTasks.findIndex((t) => t.id === task.id);
  return computeTaskColor(task, allTasks, colorModeState, taskIndex);
}
