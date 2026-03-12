/**
 * Shared drag selection state for row number cells.
 * Module-level singleton — used by RowNumberCell, TaskTableRow, and TaskTable
 * to coordinate drag-to-select across rows.
 *
 * The mouseup cleanup listener lives in TaskTable (single instance)
 * rather than in each RowNumberCell (N instances).
 *
 * @remarks **Testing**: Because this is a module-level singleton, tests that
 * manipulate `dragState` directly MUST call `resetDragState()` in `afterEach`
 * to prevent state leaking between test cases.
 */

import type { TaskId } from "../../types/branded.types";

/** Callback invoked when the pointer moves over a new row during drag-select. */
type DragSelectHandler = (taskId: TaskId) => void;

/** Mutable singleton tracking in-progress drag-selection state. */
interface DragSelectionState {
  isDragging: boolean;
  startTaskId: TaskId | null;
  onDragSelect: DragSelectHandler | null;
}

export const dragState: DragSelectionState = {
  isDragging: false,
  startTaskId: null,
  onDragSelect: null,
};

/** Reset drag state — called on global mouseup from TaskTable. */
export function resetDragState(): void {
  dragState.isDragging = false;
  dragState.startTaskId = null;
  dragState.onDragSelect = null;
}
