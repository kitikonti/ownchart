/**
 * Custom hook for building the flattened task list.
 * Centralizes the calculation that was duplicated in GanttLayout and TaskTable.
 * Respects collapsed state and maintains task hierarchy visualization.
 */

import { useMemo } from "react";
import { useTaskStore } from "../store/slices/taskSlice";
import { buildFlattenedTaskList, type FlattenedTask } from "../utils/hierarchy";
import type { Task } from "../types/chart.types";

interface UseFlattenedTasksResult {
  /** Flattened task list with hierarchy info (level, hasChildren) */
  flattenedTasks: FlattenedTask[];
  /** Just the tasks in visual order (for ChartCanvas) */
  orderedTasks: Task[];
}

/**
 * Hook that builds the flattened task list based on current tasks and collapsed state.
 * Uses memoization to prevent unnecessary recalculations.
 *
 * @returns Object containing flattenedTasks (with hierarchy info) and orderedTasks (just tasks)
 */
export function useFlattenedTasks(): UseFlattenedTasksResult {
  const tasks = useTaskStore((state) => state.tasks);

  const flattenedTasks = useMemo(() => {
    const collapsedIds = new Set(
      tasks.filter((t) => t.open === false).map((t) => t.id)
    );
    return buildFlattenedTaskList(tasks, collapsedIds);
  }, [tasks]);

  const orderedTasks = useMemo(
    () => flattenedTasks.map(({ task }) => task),
    [flattenedTasks]
  );

  return { flattenedTasks, orderedTasks };
}
