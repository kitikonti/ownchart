/**
 * Hook for cell navigation and editing in the task table.
 * Provides Excel-like keyboard navigation functionality.
 */

import { useTaskStore, type EditableField, type NavigationDirection } from '../store/slices/taskSlice';

export interface UseCellNavigationReturn {
  /** Current active cell */
  activeCell: {
    taskId: string | null;
    field: EditableField | null;
  };

  /** Whether a cell is currently being edited */
  isEditingCell: boolean;

  /** Set the active cell */
  setActiveCell: (taskId: string | null, field: EditableField | null) => void;

  /** Navigate to adjacent cell */
  navigateCell: (direction: NavigationDirection) => void;

  /** Start editing the active cell */
  startCellEdit: () => void;

  /** Stop editing (save or cancel) */
  stopCellEdit: () => void;

  /** Check if a specific cell is active */
  isCellActive: (taskId: string, field: EditableField) => boolean;

  /** Check if a specific cell is being edited */
  isCellEditing: (taskId: string, field: EditableField) => boolean;
}

/**
 * Cell navigation hook.
 */
export function useCellNavigation(): UseCellNavigationReturn {
  const activeCell = useTaskStore((state) => state.activeCell);
  const isEditingCell = useTaskStore((state) => state.isEditingCell);
  const setActiveCell = useTaskStore((state) => state.setActiveCell);
  const navigateCell = useTaskStore((state) => state.navigateCell);
  const startCellEdit = useTaskStore((state) => state.startCellEdit);
  const stopCellEdit = useTaskStore((state) => state.stopCellEdit);

  const isCellActive = (taskId: string, field: EditableField): boolean => {
    return activeCell.taskId === taskId && activeCell.field === field;
  };

  const isCellEditing = (taskId: string, field: EditableField): boolean => {
    return isCellActive(taskId, field) && isEditingCell;
  };

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
