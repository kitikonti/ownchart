/**
 * Shared paste pipeline for row-level clipboard operations.
 * Extracts the common logic between pasteRows and pasteExternalRows.
 */

import type { Task } from "../../types/chart.types";
import type { TaskId } from "../../types/branded.types";
import type { ActiveCell } from "../../types/task.types";
import type { Dependency } from "../../types/dependency.types";
import type { FlattenedTask } from "../hierarchy";
import {
  buildFlattenedTaskList,
  getTaskLevel,
  calculateSummaryDates,
  MAX_HIERARCHY_DEPTH,
} from "../hierarchy";
import { remapTaskIds, remapDependencies } from "./remapIds";
import { determineInsertPosition } from "./insertPosition";

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

  // Build flattened list to determine visual insert position
  const collapsedIds = new Set(
    currentTasks.filter((t) => t.open === false).map((t) => t.id)
  );
  const flattenedTasks: FlattenedTask[] = buildFlattenedTaskList(
    currentTasks,
    collapsedIds
  );

  // Determine insert position in the flattened (visual) list
  const insertIndex = determineInsertPosition(
    activeCell,
    selectedTaskIds,
    flattenedTasks
  );

  // Get the actual ORDER value at the insert position
  let insertOrder: number;
  let targetParent: TaskId | undefined;

  if (insertIndex < flattenedTasks.length) {
    const taskAtPosition = flattenedTasks[insertIndex];
    insertOrder = taskAtPosition.task.order;
    targetParent = taskAtPosition.task.parent;
  } else {
    // reduce with initial -1 handles empty currentTasks (returns -1 + 1 = 0)
    insertOrder =
      currentTasks.reduce((max, t) => Math.max(max, t.order), -1) + 1;
  }

  // Depth of the insertion target in the existing tree (0 = top-level)
  const targetParentLevel = targetParent
    ? getTaskLevel(currentTasks, targetParent) + 1
    : 0;

  // Generate new UUIDs and remap IDs
  const { remappedTasks, idMapping } = remapTaskIds(clipboardTasks);

  // Build a Map for O(1) depth lookup (replaces O(n²) Array.find in loop)
  const pastedTaskMap = new Map(remappedTasks.map((t) => [t.id, t]));
  const pastedTaskIds = new Set(remappedTasks.map((t) => t.id));

  const getDepthInPasted = (task: Task): number => {
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
  };

  const maxPastedDepth = remappedTasks.reduce(
    (max, t) => Math.max(max, getDepthInPasted(t)),
    0
  );

  // Validate depth
  if (targetParentLevel + maxPastedDepth >= MAX_HIERARCHY_DEPTH) {
    return {
      error: `Cannot paste: would exceed maximum nesting depth of ${MAX_HIERARCHY_DEPTH} levels`,
    };
  }

  // Remap dependencies
  const remappedDependencies = remapDependencies(
    clipboardDependencies,
    idMapping
  );

  // Shift order for existing tasks at or after insert position
  const shiftedTasks = currentTasks.map((t) => {
    if (t.order >= insertOrder) {
      return { ...t, order: t.order + remappedTasks.length };
    }
    return t;
  });

  // Set order and parent for new tasks
  const newTasks = remappedTasks.map((t, i) => {
    const isRootInClipboard = !t.parent || !pastedTaskIds.has(t.parent);
    return {
      ...t,
      order: insertOrder + i,
      parent: isRootInClipboard ? targetParent : t.parent,
    };
  });

  // Merge all tasks
  const mergedTasks = [...shiftedTasks, ...newTasks];

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
 * Returns updated tasks array, or the original if no recalculation needed.
 *
 * @note Only recalculates a single level (the immediate parent). If the parent
 * is itself a child of another summary, the ancestor summary is NOT updated
 * by this function. Callers that need full ancestor propagation must chain
 * multiple calls up the ancestor tree.
 */
export function applySummaryRecalculation(
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
