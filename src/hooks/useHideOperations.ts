/**
 * Hook encapsulating hide/unhide task operations.
 * Centralizes command recording, markDirty, and toast feedback
 * used by TaskTable, Ribbon, and useKeyboardShortcuts.
 */

import { useCallback } from "react";
import toast from "react-hot-toast";
import { useChartStore } from "@/store/slices/chartSlice";
import { useHistoryStore } from "@/store/slices/historySlice";
import { useFileStore } from "@/store/slices/fileSlice";
import { CommandType } from "@/types/command.types";
import { pluralize } from "@/utils/stringUtils";
import { useFlattenedTasks } from "./useFlattenedTasks";
import type { FlattenedTask } from "@/utils/hierarchy";
import type { TaskId } from "@/types/branded.types";

interface UseHideOperationsResult {
  /** Hide tasks by IDs (includes descendants for summary tasks). Records undo command. */
  hideRows: (taskIds: TaskId[]) => void;
  /** Unhide all hidden tasks. Records undo command. */
  showAll: () => void;
  /** Unhide tasks whose globalRowNumber falls within a gap range. Records undo command. */
  unhideRange: (fromRowNum: number, toRowNum: number) => void;
  /** Unhide hidden tasks spanned by the current selection (≥2 selected rows). */
  unhideSelection: (selectedTaskIds: TaskId[]) => void;
  /** Count how many hidden tasks are spanned by the current selection. */
  getHiddenInSelectionCount: (selectedTaskIds: TaskId[]) => number;
}

/**
 * Pure helper: given visible and all flattened task lists plus current hidden state,
 * returns the IDs of hidden tasks that fall within the row range spanned by the
 * selected task IDs. Exported for unit testing.
 *
 * @param selectedTaskIds - IDs of the currently selected tasks (must have ≥2 to produce a range).
 * @param flattenedTasks - Visible (non-hidden) flattened task list; used to resolve row numbers for selected tasks.
 * @param allFlattenedTasks - Full flattened task list including hidden tasks; used to find hidden tasks in the range.
 * @param hiddenTaskIds - Current set of hidden task IDs from chartSlice.
 * @returns IDs of hidden tasks whose globalRowNumber falls within [firstSelectedRow, lastSelectedRow].
 */
export function computeHiddenIdsInSelection(
  selectedTaskIds: TaskId[],
  flattenedTasks: FlattenedTask[],
  allFlattenedTasks: FlattenedTask[],
  hiddenTaskIds: TaskId[]
): TaskId[] {
  if (selectedTaskIds.length < 2) return [];

  const selectedSet = new Set(selectedTaskIds);
  const selectedRowNums = flattenedTasks
    .filter(({ task }) => selectedSet.has(task.id))
    .map(({ globalRowNumber }) => globalRowNumber)
    .sort((a, b) => a - b);

  if (selectedRowNums.length < 2) return [];

  const firstRow = selectedRowNums[0];
  const lastRow = selectedRowNums[selectedRowNums.length - 1];
  const hiddenSet = new Set(hiddenTaskIds);

  return allFlattenedTasks
    .filter(
      (item) =>
        item.globalRowNumber >= firstRow &&
        item.globalRowNumber <= lastRow &&
        hiddenSet.has(item.task.id)
    )
    .map((item) => item.task.id);
}

/**
 * Hook encapsulating all hide/unhide task operations used by TaskTable, Ribbon,
 * and useKeyboardShortcuts. Each operation:
 * - Reads/writes chartSlice hiddenTaskIds (via getState for non-reactive reads)
 * - Records an invertible command in historySlice for undo/redo
 * - Marks the file dirty via fileSlice
 * - Shows a toast confirmation
 */
export function useHideOperations(): UseHideOperationsResult {
  const hideTasks = useChartStore((state) => state.hideTasks);
  const { flattenedTasks, allFlattenedTasks } = useFlattenedTasks();

  /** Shared logic for unhiding specific task IDs: update store, record command, show toast. */
  const executeUnhide = useCallback((idsToUnhide: TaskId[]): void => {
    if (idsToUnhide.length === 0) return;

    const previousHiddenTaskIds = [...useChartStore.getState().hiddenTaskIds];
    useChartStore.getState().unhideTasks(idsToUnhide);
    useFileStore.getState().markDirty();

    useHistoryStore.getState().recordCommand({
      id: crypto.randomUUID(),
      type: CommandType.UNHIDE_TASKS,
      timestamp: Date.now(),
      description: `Show ${pluralize(idsToUnhide.length, "hidden task")}`,
      params: {
        taskIds: idsToUnhide,
        previousHiddenTaskIds,
      },
    });

    toast.success(`${pluralize(idsToUnhide.length, "task")} shown`);
    // review: intentional — empty dep array: all store reads use getState() (non-reactive),
    // so no captured values can go stale. `pluralize` is a pure module-level import.
    // Contrast with `hideRows` which lists `hideTasks` because that ref comes from a
    // reactive useChartStore selector, not getState().
  }, []);

  const hideRows = useCallback(
    (taskIds: TaskId[]): void => {
      if (taskIds.length === 0) return;

      const previousHiddenTaskIds = [...useChartStore.getState().hiddenTaskIds];
      hideTasks(taskIds);
      useFileStore.getState().markDirty();

      // Count how many were actually hidden (including descendants).
      // hideTasks() is a synchronous Zustand action, so getState() immediately
      // reflects the updated hiddenTaskIds after the call above.
      const newHiddenIds = useChartStore.getState().hiddenTaskIds;
      const newlyHiddenCount =
        newHiddenIds.length - previousHiddenTaskIds.length;

      const prevSet = new Set(previousHiddenTaskIds);
      useHistoryStore.getState().recordCommand({
        id: crypto.randomUUID(),
        type: CommandType.HIDE_TASKS,
        timestamp: Date.now(),
        description: `Hide ${pluralize(newlyHiddenCount, "task")}`,
        params: {
          taskIds: newHiddenIds.filter((id) => !prevSet.has(id)),
          previousHiddenTaskIds,
        },
      });

      toast.success(`${pluralize(newlyHiddenCount, "task")} hidden`);
    },
    [hideTasks]
  );

  const showAll = useCallback((): void => {
    const hiddenTaskIds = useChartStore.getState().hiddenTaskIds;
    if (hiddenTaskIds.length === 0) return;

    const previousHiddenTaskIds = [...hiddenTaskIds];
    useChartStore.getState().unhideAll();
    useFileStore.getState().markDirty();

    useHistoryStore.getState().recordCommand({
      id: crypto.randomUUID(),
      type: CommandType.UNHIDE_TASKS,
      timestamp: Date.now(),
      description: `Show all ${previousHiddenTaskIds.length} hidden tasks`,
      params: {
        taskIds: previousHiddenTaskIds,
        previousHiddenTaskIds,
      },
    });

    toast.success("All tasks shown");
    // All store access via getState(); no reactive deps needed.
  }, []);

  const unhideRange = useCallback(
    (fromRowNum: number, toRowNum: number): void => {
      const idsToUnhide = allFlattenedTasks
        .filter(
          (item) =>
            item.globalRowNumber > fromRowNum && item.globalRowNumber < toRowNum
        )
        .map((item) => item.task.id);
      executeUnhide(idsToUnhide);
    },
    [allFlattenedTasks, executeUnhide]
  );

  const getHiddenInSelectionCount = useCallback(
    (selectedTaskIds: TaskId[]): number => {
      return computeHiddenIdsInSelection(
        selectedTaskIds,
        flattenedTasks,
        allFlattenedTasks,
        useChartStore.getState().hiddenTaskIds
      ).length;
    },
    [flattenedTasks, allFlattenedTasks]
  );

  const unhideSelection = useCallback(
    (selectedTaskIds: TaskId[]): void => {
      executeUnhide(
        computeHiddenIdsInSelection(
          selectedTaskIds,
          flattenedTasks,
          allFlattenedTasks,
          useChartStore.getState().hiddenTaskIds
        )
      );
    },
    [executeUnhide, flattenedTasks, allFlattenedTasks]
  );

  return {
    hideRows,
    showAll,
    unhideRange,
    unhideSelection,
    getHiddenInSelectionCount,
  };
}
