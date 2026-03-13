/**
 * Aggregates the Zustand task-store slices needed by TaskTableHeader.
 * Keeps the component body free of repeated useTaskStore() boilerplate.
 *
 * Uses a single useShallow subscription instead of seven separate
 * useTaskStore() calls so that only one Zustand subscription is created,
 * and re-renders are skipped when unrelated state changes.
 */

import { useShallow } from "zustand/react/shallow";
import { useTaskStore, type TaskStore } from "@/store/slices/taskSlice";

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
  return useTaskStore(
    useShallow((state) => ({
      tasks: state.tasks,
      selectedTaskIds: state.selectedTaskIds,
      selectAllTasks: state.selectAllTasks,
      clearSelection: state.clearSelection,
      columnWidths: state.columnWidths,
      setColumnWidth: state.setColumnWidth,
      autoFitColumn: state.autoFitColumn,
    }))
  );
}
