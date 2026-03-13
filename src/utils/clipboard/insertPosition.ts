/**
 * Utility functions for determining where to insert pasted tasks.
 * Implements Excel-like paste behavior.
 */

import type { TaskId } from "@/types/branded.types";
import type { ActiveCell } from "@/types/task.types";
import type { FlattenedTask } from "@/utils/hierarchy";
import { PLACEHOLDER_TASK_ID } from "@/config/placeholderRow";

/**
 * Determine where to insert pasted rows based on the flattened (visual) list.
 * Builds a single index Map shared by Priority 2 and Priority 3 lookups to
 * avoid redundant O(n) traversals.
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
  activeCell: Pick<ActiveCell, "taskId">,
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
  // Edge case: placeholder was range-selected but activeCell is not on the placeholder row.
  if (realSelectedIds.length === 0 && selectedTaskIds.length > 0) {
    return flattenedTasks.length;
  }

  // Build index map once — shared by Priority 2 and Priority 3 to avoid
  // a second O(n) traversal when Priority 2 misses and falls through.
  const indexMap = new Map(flattenedTasks.map(({ task }, i) => [task.id, i]));

  // Priority 2: Active cell row -> insert above it
  if (activeCell.taskId !== null) {
    const index = indexMap.get(activeCell.taskId) ?? -1;
    if (index !== -1) return index;
  }

  // Priority 3: Bottommost selected row -> insert after it.
  // Uses pre-built indexMap rather than relying on store preserving visual order.
  if (realSelectedIds.length > 0) {
    let lastIndex = -1;
    for (const id of realSelectedIds) {
      const idx = indexMap.get(id) ?? -1;
      if (idx > lastIndex) lastIndex = idx;
    }
    if (lastIndex !== -1) return lastIndex + 1;
  }

  // Priority 4: End of list
  return flattenedTasks.length;
}
