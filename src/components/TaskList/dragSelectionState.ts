/**
 * Shared drag selection state for row number cells.
 * Module-level singleton — used by RowNumberCell, TaskTableRow, and TaskTable
 * to coordinate drag-to-select across rows.
 *
 * The mouseup cleanup listener lives in TaskTable (single instance)
 * rather than in each RowNumberCell (N instances).
 */

import type { TaskId } from "../../types/branded.types";

export const dragState = {
  isDragging: false,
  startTaskId: null as TaskId | null,
  onDragSelect: null as ((taskId: TaskId) => void) | null,
};

/** Reset drag state — called on global mouseup from TaskTable. */
export function resetDragState(): void {
  dragState.isDragging = false;
  dragState.startTaskId = null;
  dragState.onDragSelect = null;
}
