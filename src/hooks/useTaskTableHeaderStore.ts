/**
 * Aggregates the Zustand task-store slices needed by TaskTableHeader.
 * Keeps the component body free of repeated useTaskStore() boilerplate.
 */

import { useTaskStore } from "../store/slices/taskSlice";
import type { TaskStore } from "../store/slices/taskSlice";

export interface TaskTableHeaderStoreSlice {
  tasks: TaskStore["tasks"];
  selectedTaskIds: TaskStore["selectedTaskIds"];
  selectAllTasks: TaskStore["selectAllTasks"];
  clearSelection: TaskStore["clearSelection"];
  columnWidths: TaskStore["columnWidths"];
  setColumnWidth: TaskStore["setColumnWidth"];
  autoFitColumn: TaskStore["autoFitColumn"];
}

export function useTaskTableHeaderStore(): TaskTableHeaderStoreSlice {
  const tasks = useTaskStore((state) => state.tasks);
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const selectAllTasks = useTaskStore((state) => state.selectAllTasks);
  const clearSelection = useTaskStore((state) => state.clearSelection);
  const columnWidths = useTaskStore((state) => state.columnWidths);
  const setColumnWidth = useTaskStore((state) => state.setColumnWidth);
  const autoFitColumn = useTaskStore((state) => state.autoFitColumn);

  return {
    tasks,
    selectedTaskIds,
    selectAllTasks,
    clearSelection,
    columnWidths,
    setColumnWidth,
    autoFitColumn,
  };
}
