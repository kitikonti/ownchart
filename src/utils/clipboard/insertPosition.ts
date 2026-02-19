/**
 * Utility functions for determining where to insert pasted tasks.
 * Implements Excel-like paste behavior.
 */

import type { FlattenedTask } from "../hierarchy";
import { PLACEHOLDER_TASK_ID } from "../../config/placeholderRow";

/**
 * Determine where to insert pasted rows based on the flattened (visual) list.
 *
 * Priority:
 * 1. If placeholder row is active/selected -> insert at end
 * 2. Above active row (if active cell exists)
 * 3. Below last selected row (if selection exists)
 * 4. At end of list (default)
 *
 * @param activeCell - Current active cell state
 * @param selectedTaskIds - Currently selected task IDs
 * @param flattenedTasks - Flattened task list (visual order)
 * @returns Index in the flattened list where tasks should be inserted
 */
export function determineInsertPosition(
  activeCell: { taskId: string | null },
  selectedTaskIds: string[],
  flattenedTasks: FlattenedTask[]
): number {
  // Priority 1: Placeholder row is active or selected -> insert at end
  if (activeCell.taskId === PLACEHOLDER_TASK_ID) {
    return flattenedTasks.length;
  }

  // Check if placeholder is in selection (filter it out for other checks)
  const realSelectedIds = selectedTaskIds.filter(
    (id) => id !== PLACEHOLDER_TASK_ID
  );
  const placeholderSelected = selectedTaskIds.includes(PLACEHOLDER_TASK_ID);

  // If only placeholder is selected, insert at end
  if (placeholderSelected && realSelectedIds.length === 0) {
    return flattenedTasks.length;
  }

  // Priority 2: Active cell row (insert above it)
  if (activeCell.taskId) {
    const index = flattenedTasks.findIndex(
      ({ task }) => task.id === activeCell.taskId
    );
    if (index !== -1) {
      return index; // Insert before active row
    }
  }

  // Priority 3: Last selected row (insert after it)
  if (realSelectedIds.length > 0) {
    const lastSelectedId = realSelectedIds[realSelectedIds.length - 1];
    const index = flattenedTasks.findIndex(
      ({ task }) => task.id === lastSelectedId
    );
    if (index !== -1) {
      return index + 1; // Insert after last selected
    }
  }

  // Priority 4: End of list
  return flattenedTasks.length;
}
