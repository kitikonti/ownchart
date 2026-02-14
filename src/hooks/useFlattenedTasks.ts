/**
 * Custom hook for building the flattened task list.
 * Centralizes the calculation that was duplicated in GanttLayout and TaskTable.
 * Respects collapsed state and hidden task filtering.
 *
 * Two-stage processing:
 * 1. Build full flattened list (respecting collapse) → assign globalRowNumber
 * 2. Filter out hidden tasks → visible list with row number gaps (Excel-style)
 */

import { useMemo } from "react";
import { useTaskStore } from "../store/slices/taskSlice";
import { useChartStore } from "../store/slices/chartSlice";
import { buildFlattenedTaskList, type FlattenedTask } from "../utils/hierarchy";
import type { Task } from "../types/chart.types";

interface UseFlattenedTasksResult {
  /** Visible flattened task list (hidden tasks filtered out) with hierarchy info */
  flattenedTasks: FlattenedTask[];
  /** Full flattened task list (including hidden) — needed for unhide-by-range */
  allFlattenedTasks: FlattenedTask[];
  /** Just the visible tasks in visual order (for ChartCanvas) */
  orderedTasks: Task[];
}

/**
 * Hook that builds the flattened task list based on current tasks, collapsed state,
 * and hidden task IDs. Uses memoization to prevent unnecessary recalculations.
 *
 * @returns Object containing flattenedTasks (visible, with gaps), allFlattenedTasks (full), and orderedTasks
 */
export function useFlattenedTasks(): UseFlattenedTasksResult {
  const tasks = useTaskStore((state) => state.tasks);
  const hiddenTaskIds = useChartStore((state) => state.hiddenTaskIds);

  // Stage 1: Build full flattened list with globalRowNumber
  const allFlattenedTasks = useMemo(() => {
    const collapsedIds = new Set(
      tasks.filter((t) => t.open === false).map((t) => t.id)
    );
    return buildFlattenedTaskList(tasks, collapsedIds);
  }, [tasks]);

  // Stage 2: Filter out hidden tasks (preserving globalRowNumber for gaps)
  const flattenedTasks = useMemo(() => {
    if (hiddenTaskIds.length === 0) return allFlattenedTasks;
    const hiddenSet = new Set(hiddenTaskIds);
    return allFlattenedTasks.filter((item) => !hiddenSet.has(item.task.id));
  }, [allFlattenedTasks, hiddenTaskIds]);

  const orderedTasks = useMemo(
    () => flattenedTasks.map(({ task }) => task),
    [flattenedTasks]
  );

  return { flattenedTasks, allFlattenedTasks, orderedTasks };
}
