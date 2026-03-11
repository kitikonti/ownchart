/**
 * Hook for cell navigation and editing in the task table.
 * Provides Excel-like keyboard navigation functionality.
 */

import { useCallback } from "react";
import {
  useTaskStore,
  type EditableField,
  type NavigationDirection,
} from "../store/slices/taskSlice";
import type { TaskId } from "../types/branded.types";

export interface UseCellNavigationReturn {
  /** Current active cell */
  activeCell: {
    taskId: TaskId | null;
    field: EditableField | null;
  };

  /** Whether a cell is currently being edited */
  isEditingCell: boolean;

  /** Set the active cell */
  setActiveCell: (taskId: TaskId | null, field: EditableField | null) => void;

  /** Navigate to adjacent cell */
  navigateCell: (direction: NavigationDirection) => void;

  /** Start editing the active cell */
  startCellEdit: () => void;

  /** Stop editing (save or cancel) */
  stopCellEdit: () => void;

  /** Check if a specific cell is active */
  isCellActive: (taskId: TaskId, field: EditableField) => boolean;

  /** Check if a specific cell is being edited */
  isCellEditing: (taskId: TaskId, field: EditableField) => boolean;
}

/**
 * Facade hook that exposes cell-navigation state and actions from the task
 * store in a single, typed object.  Consumers never need to import from the
 * store directly — they call this hook and get `activeCell`, `isCellActive`,
 * `isCellEditing`, and the store actions (`navigateCell`, `setActiveCell`, …).
 */
export function useCellNavigation(): UseCellNavigationReturn {
  const activeCell = useTaskStore((state) => state.activeCell);
  const isEditingCell = useTaskStore((state) => state.isEditingCell);
  const setActiveCell = useTaskStore((state) => state.setActiveCell);
  const navigateCell = useTaskStore((state) => state.navigateCell);
  const startCellEdit = useTaskStore((state) => state.startCellEdit);
  const stopCellEdit = useTaskStore((state) => state.stopCellEdit);

  const isCellActive = useCallback(
    (taskId: TaskId, field: EditableField): boolean => {
      return activeCell.taskId === taskId && activeCell.field === field;
    },
    [activeCell]
  );

  const isCellEditing = useCallback(
    (taskId: TaskId, field: EditableField): boolean => {
      return isCellActive(taskId, field) && isEditingCell;
    },
    [isCellActive, isEditingCell]
  );

  return {
    activeCell,
    isEditingCell,
    setActiveCell,
    navigateCell,
    startCellEdit,
    stopCellEdit,
    isCellActive,
    isCellEditing,
  };
}
