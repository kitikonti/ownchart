/**
 * Shared paste pipeline for row-level clipboard operations.
 * Extracts the common logic between pasteRows and pasteExternalRows.
 */

import type { Task } from "../../types/chart.types";
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
  activeCell: { taskId: string | null };
  /** Currently selected task IDs. */
  selectedTaskIds: string[];
}

export interface PrepareRowPasteResult {
  /** All tasks merged (existing shifted + new). */
  mergedTasks: Task[];
  /** Just the new tasks (with final order + parent). */
  newTasks: Task[];
  /** Remapped dependencies for the pasted tasks. */
  remappedDependencies: Dependency[];
  /** Old ID → new ID mapping. */
  idMapping: Record<string, string>;
  /** Order value at which new tasks were inserted. */
  insertOrder: number;
  /** Parent assigned to root-level pasted tasks. */
  targetParent: string | undefined;
}

/**
 * Pure function that prepares all data needed for a row paste operation.
 * Returns either a successful result or an error string.
 */
export function prepareRowPaste(
  input: PrepareRowPasteInput
): PrepareRowPasteResult | { error: string } {
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
  let targetParent: string | undefined = undefined;
  let targetParentLevel = 0;

  if (insertIndex < flattenedTasks.length) {
    const taskAtPosition = flattenedTasks[insertIndex];
    insertOrder = taskAtPosition.task.order;
    targetParent = taskAtPosition.task.parent;
    if (targetParent) {
      targetParentLevel = getTaskLevel(currentTasks, targetParent) + 1;
    }
  } else {
    insertOrder = Math.max(...currentTasks.map((t) => t.order), -1) + 1;
  }

  // Generate new UUIDs and remap IDs
  const { remappedTasks, idMapping } = remapTaskIds(clipboardTasks);

  // Build a Map for depth lookup (N2 fix: Map.get instead of Array.find in loop)
  const pastedTaskMap = new Map(remappedTasks.map((t) => [t.id, t]));
  const pastedTaskIds = new Set(remappedTasks.map((t) => t.id));

  const getDepthInPasted = (task: Task): number => {
    let depth = 0;
    let current = task;
    while (current.parent && pastedTaskIds.has(current.parent)) {
      depth++;
      const parent = pastedTaskMap.get(current.parent);
      if (!parent) break;
      current = parent;
    }
    return depth;
  };

  const maxPastedDepth = Math.max(...remappedTasks.map(getDepthInPasted), 0);

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
    return { ...t };
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
 */
export function applySummaryRecalculation(
  tasks: Task[],
  targetParent: string | undefined
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
