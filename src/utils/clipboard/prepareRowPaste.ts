/**
 * Shared paste pipeline for row-level clipboard operations.
 * Extracts the common logic between pasteRows and pasteExternalRows.
 */

import type { Task } from "../../types/chart.types";
import type { TaskId } from "../../types/branded.types";
import type { Dependency } from "../../types/dependency.types";
import type { ActiveCell } from "../../types/task.types";
import type { FlattenedTask } from "../hierarchy";
import {
  buildFlattenedTaskList,
  calculateSummaryDates,
  getTaskLevel,
  MAX_HIERARCHY_DEPTH,
} from "../hierarchy";
import { determineInsertPosition } from "./insertPosition";
import { remapDependencies, remapTaskIds } from "./remapIds";

export interface PrepareRowPasteInput {
  /** Tasks currently in the clipboard (will be remapped to new IDs). */
  clipboardTasks: Task[];
  /** Dependencies from the clipboard. */
  clipboardDependencies: Dependency[];
  /** Current tasks in the task store. */
  currentTasks: Task[];
  /** Active cell state for insert position. */
  activeCell: Pick<ActiveCell, "taskId">;
  /** Currently selected task IDs. */
  selectedTaskIds: TaskId[];
}

export interface PrepareRowPasteResult {
  /** All tasks merged (existing shifted + new). */
  mergedTasks: Task[];
  /** Just the new tasks (with final order + parent). */
  newTasks: Task[];
  /** Remapped dependencies for the pasted tasks. */
  remappedDependencies: Dependency[];
  /** Old ID → new ID mapping. */
  idMapping: Record<TaskId, TaskId>;
  /** Order value at which new tasks were inserted. */
  insertOrder: number;
  /** Parent assigned to root-level pasted tasks. */
  targetParent: TaskId | undefined;
}

/** Returned by {@link prepareRowPaste} when the paste cannot proceed. */
export interface PrepareRowPasteError {
  error: string;
}

/**
 * Resolved insertion context: order value, parent, and depth at which new
 * tasks will be anchored into the existing tree.
 * Returned by the internal `resolveInsertContext` helper and re-exported
 * for consumers that need to inspect the insertion point independently.
 */
export interface InsertContext {
  insertOrder: number;
  targetParent: TaskId | undefined;
  targetDepth: number;
}

/**
 * Computes the ancestor depth of a single task within the pasted set.
 * Traverses parent links upward, stopping at the first parent that is not
 * part of the pasted set or when a cycle is detected.
 *
 * @param task - The task to measure depth for.
 * @param pastedTaskMap - Map of all tasks in the pasted set (id → task).
 * @param pastedTaskIds - Set of all IDs in the pasted set (for O(1) lookup).
 * @returns The number of ancestor hops within the pasted set (0 = root-level).
 */
function getDepthInPasted(
  task: Task,
  pastedTaskMap: Map<TaskId, Task>,
  pastedTaskIds: Set<TaskId>
): number {
  let depth = 0;
  let current = task;
  // Guard against circular parent references in malformed clipboard data.
  const visited = new Set<TaskId>();
  while (current.parent && pastedTaskIds.has(current.parent)) {
    if (visited.has(current.parent)) break; // cycle detected — stop traversal
    visited.add(current.parent);
    depth++;
    const parent = pastedTaskMap.get(current.parent);
    if (!parent) break;
    current = parent;
  }
  return depth;
}

/**
 * Computes the maximum depth of any task within the remapped (pasted) set.
 * Guards against circular parent references in malformed clipboard data using
 * a visited-set cycle detector.
 *
 * @param remappedTasks - Tasks with new IDs (output of remapTaskIds).
 * @returns The maximum depth (0 = all tasks are root-level, 1 = one level of
 *   nesting, etc.).
 */
function computeMaxPastedDepth(remappedTasks: Task[]): number {
  const pastedTaskMap = new Map(remappedTasks.map((t) => [t.id, t]));
  const pastedTaskIds = new Set(remappedTasks.map((t) => t.id));

  return remappedTasks.reduce(
    (max, t) =>
      Math.max(max, getDepthInPasted(t, pastedTaskMap, pastedTaskIds)),
    0
  );
}

/**
 * Assigns final `order` and `parent` values to the remapped tasks before merge.
 * Tasks that are top-level within the clipboard set (i.e. their parent is not
 * part of the pasted set) receive `targetParent` as their parent, anchoring
 * them into the existing tree at the correct level.
 *
 * @param remappedTasks - Tasks with new IDs (output of remapTaskIds).
 *   **Must be in intended visual insertion order**: order values are assigned
 *   as `insertOrder + i`, so the array index determines the final order.
 * @param insertOrder - The `order` value of the first pasted task.
 * @param targetParent - Parent to assign to clipboard-root tasks.
 * @returns A new array of tasks with `order` and `parent` updated; the array
 *   length and relative positions are unchanged.
 */
function assignOrderAndParent(
  remappedTasks: Task[],
  insertOrder: number,
  targetParent: TaskId | undefined
): Task[] {
  const pastedTaskIds = new Set(remappedTasks.map((t) => t.id));
  return remappedTasks.map((t, i) => {
    const isClipboardRoot = !t.parent || !pastedTaskIds.has(t.parent);
    return {
      ...t,
      order: insertOrder + i,
      parent: isClipboardRoot ? targetParent : t.parent,
    };
  });
}

/**
 * Resolves the `order` value, parent, and depth at which new tasks should be
 * inserted by translating the active cell / selection into a visual index and
 * then mapping that back to the underlying task data.
 *
 * @param currentTasks - Current tasks in the store.
 * @param activeCell - Active cell state for insert-position priority.
 * @param selectedTaskIds - Currently selected task IDs.
 * @returns Insert order value, target parent TaskId (undefined = root), and
 *   the depth of the insertion point in the existing tree.
 */
function resolveInsertContext(
  currentTasks: Task[],
  activeCell: Pick<ActiveCell, "taskId">,
  selectedTaskIds: TaskId[]
): InsertContext {
  // Build flattened list to determine visual insert position.
  // open === false (not !t.open) because undefined means open (not collapsed)
  const collapsedIds = new Set(
    currentTasks.filter((t) => t.open === false).map((t) => t.id)
  );
  const flattenedTasks: FlattenedTask[] = buildFlattenedTaskList(
    currentTasks,
    collapsedIds
  );

  const insertIndex = determineInsertPosition(
    activeCell,
    selectedTaskIds,
    flattenedTasks
  );

  let insertOrder: number;
  let targetParent: TaskId | undefined;

  if (insertIndex < flattenedTasks.length) {
    const taskAtPosition = flattenedTasks[insertIndex];
    insertOrder = taskAtPosition.task.order;
    targetParent = taskAtPosition.task.parent;
  } else {
    // Use currentTasks (not flattenedTasks) to account for hidden tasks that
    // may have higher order values than any visible task.
    // reduce with initial -1 handles empty currentTasks (returns -1 + 1 = 0)
    insertOrder =
      currentTasks.reduce((max, t) => Math.max(max, t.order), -1) + 1;
    // targetParent stays undefined — inserting at the end means root level.
  }

  // Depth of the insertion target in the existing tree (0 = top-level)
  const targetDepth = targetParent
    ? getTaskLevel(currentTasks, targetParent) + 1
    : 0;

  return { insertOrder, targetParent, targetDepth };
}

/**
 * Shifts existing tasks at or after `insertOrder` to make room for the new
 * tasks, then appends the new tasks to produce the merged list.
 *
 * @param currentTasks - Tasks currently in the store.
 * @param newTasks - New tasks (already has final order + parent assigned).
 * @param insertOrder - The order value at the insertion point.
 * @param count - Number of new tasks being inserted (used for the shift amount).
 * @returns Merged task array: shifted existing tasks followed by new tasks.
 */
function buildMergedTaskList(
  currentTasks: Task[],
  newTasks: Task[],
  insertOrder: number,
  count: number
): Task[] {
  const shiftedTasks = currentTasks.map((t) =>
    t.order >= insertOrder ? { ...t, order: t.order + count } : t
  );
  return [...shiftedTasks, ...newTasks];
}

/**
 * Pure function that prepares all data needed for a row paste operation.
 * Returns either a successful result or an error string.
 */
export function prepareRowPaste(
  input: PrepareRowPasteInput
): PrepareRowPasteResult | PrepareRowPasteError {
  const {
    clipboardTasks,
    clipboardDependencies,
    currentTasks,
    activeCell,
    selectedTaskIds,
  } = input;

  // Nothing to paste — return immediately without shifting or remapping.
  if (clipboardTasks.length === 0) {
    return {
      mergedTasks: currentTasks,
      newTasks: [],
      remappedDependencies: [],
      // Safe: no clipboard tasks means no ID remapping needed; empty Record is correct.
      idMapping: {} as Record<TaskId, TaskId>,
      insertOrder: 0,
      targetParent: undefined,
    };
  }

  const { insertOrder, targetParent, targetDepth } = resolveInsertContext(
    currentTasks,
    activeCell,
    selectedTaskIds
  );

  // Generate new UUIDs and remap IDs
  const { remappedTasks, idMapping } = remapTaskIds(clipboardTasks);

  // Validate depth before committing to the paste
  const maxPastedDepth = computeMaxPastedDepth(remappedTasks);
  if (targetDepth + maxPastedDepth >= MAX_HIERARCHY_DEPTH) {
    return {
      error: `Cannot paste: would exceed maximum nesting depth of ${MAX_HIERARCHY_DEPTH} levels`,
    };
  }

  // Remap dependencies (only those where both endpoints are in the pasted set)
  const remappedDependencies = remapDependencies(
    clipboardDependencies,
    idMapping
  );

  // Set order and parent for new tasks, then merge with shifted existing tasks
  const newTasks = assignOrderAndParent(
    remappedTasks,
    insertOrder,
    targetParent
  );
  const mergedTasks = buildMergedTaskList(
    currentTasks,
    newTasks,
    insertOrder,
    remappedTasks.length
  );

  return {
    mergedTasks,
    newTasks,
    remappedDependencies,
    idMapping,
    insertOrder,
    targetParent,
  };
}

/**
 * Recalculates summary dates for a target parent task if it is a summary.
 * Returns the updated tasks array, or the original reference if no
 * recalculation is needed.
 *
 * **Single-level only**: only the immediate parent is updated. If the parent
 * is itself a child of another summary, the ancestor summary is NOT updated
 * by this function. Callers that need full ancestor propagation must chain
 * multiple calls up the ancestor tree.
 *
 * @param tasks - The full merged task list after paste.
 * @param targetParent - The TaskId of the summary parent to recalculate, or
 *   `undefined` to skip (returns `tasks` unchanged).
 * @returns Updated task array with recalculated summary dates, or the original
 *   array reference if `targetParent` is undefined, not found, or not a summary.
 */
export function applySingleLevelSummaryRecalculation(
  tasks: Task[],
  targetParent: TaskId | undefined
): Task[] {
  if (!targetParent) return tasks;

  const parentTask = tasks.find((t) => t.id === targetParent);
  if (!parentTask || parentTask.type !== "summary") return tasks;

  const summaryDates = calculateSummaryDates(tasks, targetParent);
  if (!summaryDates) return tasks;

  return tasks.map((t) =>
    t.id === targetParent
      ? {
          ...t,
          startDate: summaryDates.startDate,
          endDate: summaryDates.endDate,
          duration: summaryDates.duration,
        }
      : t
  );
}
