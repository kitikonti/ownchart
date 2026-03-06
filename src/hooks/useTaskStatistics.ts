import { useMemo } from "react";
import { useTaskStore } from "../store/slices/taskSlice";

export interface TaskStatistics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

/**
 * Computes task statistics for the status bar.
 * All three values are memoized against the tasks array reference.
 */
export function useTaskStatistics(): TaskStatistics {
  const tasks = useTaskStore((state) => state.tasks);

  const totalTasks = tasks.length;

  const completedTasks = useMemo(
    () => tasks.filter((t) => t.progress === 100).length,
    [tasks]
  );

  const overdueTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks.filter((t) => {
      const endDate = new Date(t.endDate);
      endDate.setHours(0, 0, 0, 0);
      return endDate < today && t.progress < 100;
    }).length;
  }, [tasks]);

  return { totalTasks, completedTasks, overdueTasks };
}
