/**
 * useIsCellEditing — focused Zustand selector for cell editing state.
 *
 * Returns true only when the specified cell is both active and in edit mode.
 * Because the selector returns a primitive boolean, Zustand skips re-renders
 * when other cells' editing state changes.
 */

import type { TaskId } from "../types/branded.types";
import { useTaskStore } from "../store/slices/taskSlice";

/** Focused selector — only re-renders when THIS cell's editing state changes. */
export function useIsCellEditing(taskId: TaskId, field: string): boolean {
  return useTaskStore(
    (s) =>
      s.activeCell.taskId === taskId &&
      s.activeCell.field === field &&
      s.isEditingCell
  );
}
