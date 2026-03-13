/**
 * useTaskRowData — Derives per-row display state for TaskTable.
 *
 * Computes clipboard position, selection position, and hidden-row gaps
 * for each visible task row. Pure helper functions are exported for testing.
 */

import { useMemo } from "react";
import type { TaskId } from "@/types/branded.types";
import { useTaskStore } from "@/store/slices/taskSlice";
import { useFlattenedTasks } from "./useFlattenedTasks";
import type { FlattenedTask } from "@/utils/hierarchy";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ClipboardPosition {
  isFirst: boolean;
  isLast: boolean;
}

export interface SelectionPosition {
  isFirstSelected: boolean;
  isLastSelected: boolean;
}

export interface TaskRowDatum {
  task: FlattenedTask["task"];
  level: number;
  hasChildren: boolean;
  globalRowNumber: number;
  hasHiddenAbove: boolean;
  hiddenAboveCount: number;
  onUnhideAbove: (() => void) | undefined;
  hasHiddenBelow: boolean;
  hiddenBelowCount: number;
  onUnhideBelow: (() => void) | undefined;
  clipboardPosition: ClipboardPosition | undefined;
  selectionPosition: SelectionPosition | undefined;
}

// ── Pure helper functions (exported for testing) ─────────────────────────────

// Cached zero-gap sentinel for rows that have nothing hidden above them.
// Avoids allocating a new object on every render for the common case.
const NO_HIDDEN_ABOVE = { hasHiddenAbove: false, hiddenAboveCount: 0 } as const;

export function getClipboardPosition(
  taskId: TaskId,
  prevTaskId: TaskId | undefined,
  nextTaskId: TaskId | undefined,
  clipboardSet: Set<TaskId>
): ClipboardPosition | undefined {
  if (!clipboardSet.has(taskId)) return undefined;
  return {
    isFirst: !prevTaskId || !clipboardSet.has(prevTaskId),
    isLast: !nextTaskId || !clipboardSet.has(nextTaskId),
  };
}

export function getSelectionPosition(
  taskId: TaskId,
  prevTaskId: TaskId | undefined,
  nextTaskId: TaskId | undefined,
  selectedSet: Set<TaskId>
): SelectionPosition | undefined {
  if (!selectedSet.has(taskId)) return undefined;
  return {
    isFirstSelected: !prevTaskId || !selectedSet.has(prevTaskId),
    isLastSelected: !nextTaskId || !selectedSet.has(nextTaskId),
  };
}

export function getHiddenGap(
  globalRowNumber: number,
  nextGlobalRowNumber: number
): { hasHiddenBelow: boolean; hiddenBelowCount: number } {
  const gap = nextGlobalRowNumber - globalRowNumber - 1;
  return {
    hasHiddenBelow: gap > 0,
    // Math.max(0, …) is a defensive guard; gap cannot be negative given
    // 1-based sequential globalRowNumbers from a sorted flattened list.
    hiddenBelowCount: Math.max(0, gap),
  };
}

export function getHiddenGapAbove(firstGlobalRowNumber: number): {
  hasHiddenAbove: boolean;
  hiddenAboveCount: number;
} {
  const count = firstGlobalRowNumber - 1;
  return {
    hasHiddenAbove: count > 0,
    // Math.max(0, …) is a defensive guard; count cannot be negative since
    // globalRowNumber is 1-based (minimum value is 1).
    hiddenAboveCount: Math.max(0, count),
  };
}

export interface UseTaskRowDataResult {
  taskRowData: TaskRowDatum[];
  visibleTaskIds: TaskId[];
  /** Convenience shortcut for taskRowData.length — avoids re-deriving in consumers. */
  flattenedTaskCount: number;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface BuildRowDatumParams {
  item: FlattenedTask;
  index: number;
  flattenedTasks: FlattenedTask[];
  /**
   * One-past-the-end sentinel row number (allFlattenedTasks.length + 1).
   * Used by getHiddenGap to detect hidden rows after the last visible task:
   * if the last visible row's globalRowNumber < sentinelRowAfterLast - 1,
   * there are hidden rows at the bottom of the list.
   */
  sentinelRowAfterLast: number;
  clipboardSet: Set<TaskId>;
  selectedSet: Set<TaskId>;
  unhideRange: (fromRowNum: number, toRowNum: number) => void;
}

interface NeighborGaps {
  prevTaskId: TaskId | undefined;
  nextTaskId: TaskId | undefined;
  nextRowNum: number;
  hasHiddenBelow: boolean;
  hiddenBelowCount: number;
  above: { hasHiddenAbove: boolean; hiddenAboveCount: number };
}

/** Resolves prev/next task IDs and below/above gap state for a given row index. */
function resolveNeighborsAndGaps(
  item: FlattenedTask,
  index: number,
  flattenedTasks: FlattenedTask[],
  sentinelRowAfterLast: number
): NeighborGaps {
  const prevTaskId = index > 0 ? flattenedTasks[index - 1].task.id : undefined;
  const nextTask: FlattenedTask | undefined = flattenedTasks[index + 1];
  const nextTaskId = nextTask?.task.id;
  const nextRowNum = nextTask ? nextTask.globalRowNumber : sentinelRowAfterLast;
  const { hasHiddenBelow, hiddenBelowCount } = getHiddenGap(
    item.globalRowNumber,
    nextRowNum
  );
  const above =
    index === 0 ? getHiddenGapAbove(item.globalRowNumber) : NO_HIDDEN_ABOVE;
  return {
    prevTaskId,
    nextTaskId,
    nextRowNum,
    hasHiddenBelow,
    hiddenBelowCount,
    above,
  };
}

/**
 * Builds the full display datum for a single task row.
 * Extracted from the useMemo callback to keep it under the 50-line budget.
 */
function buildTaskRowDatum({
  item,
  index,
  flattenedTasks,
  sentinelRowAfterLast,
  clipboardSet,
  selectedSet,
  unhideRange,
}: BuildRowDatumParams): TaskRowDatum {
  const { task, level, hasChildren, globalRowNumber } = item;
  const {
    prevTaskId,
    nextTaskId,
    nextRowNum,
    hasHiddenBelow,
    hiddenBelowCount,
    above,
  } = resolveNeighborsAndGaps(
    item,
    index,
    flattenedTasks,
    sentinelRowAfterLast
  );

  return {
    task,
    level,
    hasChildren,
    globalRowNumber,
    hasHiddenAbove: above.hasHiddenAbove,
    hiddenAboveCount: above.hiddenAboveCount,
    onUnhideAbove: above.hasHiddenAbove
      ? (): void => unhideRange(0, globalRowNumber)
      : undefined,
    hasHiddenBelow,
    hiddenBelowCount,
    onUnhideBelow: hasHiddenBelow
      ? (): void => unhideRange(globalRowNumber, nextRowNum)
      : undefined,
    clipboardPosition: getClipboardPosition(
      task.id,
      prevTaskId,
      nextTaskId,
      clipboardSet
    ),
    selectionPosition: getSelectionPosition(
      task.id,
      prevTaskId,
      nextTaskId,
      selectedSet
    ),
  };
}

/**
 * Derives per-row display state for each visible task in TaskTable.
 * Computes clipboard position, selection position, and hidden-row gap indicators.
 *
 * @param unhideRange - Callback to unhide tasks between two row numbers (exclusive).
 *   Must be a stable reference (useCallback) to avoid busting the taskRowData memo
 *   on every render.
 */
export function useTaskRowData(
  unhideRange: (fromRowNum: number, toRowNum: number) => void
): UseTaskRowDataResult {
  const clipboardTaskIds = useTaskStore((state) => state.clipboardTaskIds);
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const { flattenedTasks, allFlattenedTasks } = useFlattenedTasks();

  // Extract visible task IDs in display order (for correct range selection)
  const visibleTaskIds = useMemo(
    () => flattenedTasks.map(({ task }) => task.id),
    [flattenedTasks]
  );

  // Build sets for quick lookup
  const clipboardSet = useMemo(
    () => new Set(clipboardTaskIds),
    [clipboardTaskIds]
  );
  const selectedSet = useMemo(
    () => new Set(selectedTaskIds),
    [selectedTaskIds]
  );

  // Prepare derived props for each task row (clipboard/selection/hidden state)
  const taskRowData = useMemo(() => {
    // Sentinel: one past the end means no hidden tasks below the last visible row.
    // (globalRowNumber is 1-based; allFlattenedTasks.length + 1 is safe as sentinel.)
    const sentinelRowAfterLast = allFlattenedTasks.length + 1;

    return flattenedTasks.map((item, index) =>
      buildTaskRowDatum({
        item,
        index,
        flattenedTasks,
        sentinelRowAfterLast,
        clipboardSet,
        selectedSet,
        unhideRange,
      })
    );
  }, [
    flattenedTasks,
    clipboardSet,
    selectedSet,
    allFlattenedTasks,
    // review: intentional — unhideRange is listed as a dep so the memo recomputes
    // if the reference changes; callers must pass a stable useCallback reference
    // (documented in JSDoc above) to avoid unnecessary recomputation.
    unhideRange,
  ]);

  return {
    taskRowData,
    visibleTaskIds,
    flattenedTaskCount: flattenedTasks.length,
  };
}
