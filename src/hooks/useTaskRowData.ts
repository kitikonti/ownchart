/**
 * useTaskRowData — Derives per-row display state for TaskTable.
 *
 * Computes clipboard position, selection position, and hidden-row gaps
 * for each visible task row. Pure helper functions are exported for testing.
 */

import { useMemo } from "react";
import type { TaskId } from "../types/branded.types";
import { useTaskStore } from "../store/slices/taskSlice";
import { useFlattenedTasks } from "./useFlattenedTasks";
import type { FlattenedTask } from "../utils/hierarchy";

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
    hiddenAboveCount: Math.max(0, count),
  };
}

// Invariant: globalRowNumber is 1-based and contiguous across allFlattenedTasks.
// length+1 is therefore a safe sentinel value "one past the end" for gap detection.
const NO_HIDDEN_ABOVE = { hasHiddenAbove: false, hiddenAboveCount: 0 } as const;

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useTaskRowData(
  unhideRange: (fromRowNum: number, toRowNum: number) => void
): {
  taskRowData: TaskRowDatum[];
  visibleTaskIds: TaskId[];
  /** Convenience shortcut for taskRowData.length — avoids re-deriving in consumers. */
  flattenedTaskCount: number;
} {
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
  const taskRowData = useMemo(
    () =>
      flattenedTasks.map(
        (
          { task, level, hasChildren, globalRowNumber }: FlattenedTask,
          index: number
        ) => {
          const prevTaskId =
            index > 0 ? flattenedTasks[index - 1].task.id : undefined;
          const nextTask: FlattenedTask | undefined = flattenedTasks[index + 1];
          const nextTaskId = nextTask?.task.id;

          // Sentinel: one past the end means no hidden tasks below the last visible row.
          // (globalRowNumber is 1-based; allFlattenedTasks.length + 1 is safe as sentinel.)
          const SENTINEL_AFTER_LAST = allFlattenedTasks.length + 1;
          const nextRowNum = nextTask
            ? nextTask.globalRowNumber
            : SENTINEL_AFTER_LAST;
          const { hasHiddenBelow, hiddenBelowCount } = getHiddenGap(
            globalRowNumber,
            nextRowNum
          );

          const above =
            index === 0 ? getHiddenGapAbove(globalRowNumber) : NO_HIDDEN_ABOVE;

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
      ),
    [flattenedTasks, clipboardSet, selectedSet, allFlattenedTasks, unhideRange]
  );

  return {
    taskRowData,
    visibleTaskIds,
    flattenedTaskCount: flattenedTasks.length,
  };
}
