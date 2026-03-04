/**
 * Utility functions for determining where to insert pasted tasks.
 * Implements Excel-like paste behavior.
 */

import type { TaskId } from "../../types/branded.types";
import type { FlattenedTask } from "../hierarchy";
import { PLACEHOLDER_TASK_ID } from "../../config/placeholderRow";

/**
 * Find the visual index of the bottommost task among the given IDs.
 * Pre-builds an index map to avoid O(n²) findIndex-in-loop.
 * Returns -1 if none of the IDs are found in the flattened list.
 */
function findBottommostIndex(
  taskIds: TaskId[],
  flattenedTasks: FlattenedTask[]
): number {
  const indexMap = new Map(flattenedTasks.map(({ task }, i) => [task.id, i]));
  let lastIndex = -1;
  for (const id of taskIds) {
    const idx = indexMap.get(id) ?? -1;
    if (idx > lastIndex) lastIndex = idx;
  }
  return lastIndex;
}

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
  activeCell: { taskId: TaskId | null },
  selectedTaskIds: TaskId[],
  flattenedTasks: FlattenedTask[]
): number {
  // Priority 1: Placeholder row is active -> insert at end
  if (activeCell.taskId === PLACEHOLDER_TASK_ID) {
    return flattenedTasks.length;
  }

  // Strip placeholder from selection; if it was the only selection, insert at end
  const realSelectedIds = selectedTaskIds.filter(
    (id) => id !== PLACEHOLDER_TASK_ID
  );
  if (realSelectedIds.length === 0 && selectedTaskIds.length > 0) {
    return flattenedTasks.length;
  }

  // Priority 2: Active cell row -> insert above it
  if (activeCell.taskId) {
    const index = flattenedTasks.findIndex(
      ({ task }) => task.id === activeCell.taskId
    );
    if (index !== -1) return index;
  }

  // Priority 3: Bottommost selected row -> insert after it.
  // Uses findBottommostIndex rather than relying on store preserving visual order.
  if (realSelectedIds.length > 0) {
    const lastIndex = findBottommostIndex(realSelectedIds, flattenedTasks);
    if (lastIndex !== -1) return lastIndex + 1;
  }

  // Priority 4: End of list
  return flattenedTasks.length;
}
