/**
 * Hook encapsulating hide/unhide task operations.
 * Centralizes command recording, markDirty, and toast feedback
 * used by TaskTable, Ribbon, and useKeyboardShortcuts.
 */

import { useCallback } from "react";
import { useChartStore } from "../store/slices/chartSlice";
import { useHistoryStore } from "../store/slices/historySlice";
import { useFileStore } from "../store/slices/fileSlice";
import { useFlattenedTasks } from "./useFlattenedTasks";
import { CommandType } from "../types/command.types";
import toast from "react-hot-toast";

/** Simple pluralization: pluralize(3, "task") → "3 tasks" */
function pluralize(count: number, word: string): string {
  return `${count} ${word}${count !== 1 ? "s" : ""}`;
}

interface UseHideOperationsResult {
  /** Hide tasks by IDs (includes descendants for summary tasks). Records undo command. */
  hideRows: (taskIds: string[]) => void;
  /** Unhide all hidden tasks. Records undo command. */
  showAll: () => void;
  /** Unhide tasks whose globalRowNumber falls within a gap range. Records undo command. */
  unhideRange: (fromRowNum: number, toRowNum: number) => void;
  /** Unhide hidden tasks spanned by the current selection (≥2 selected rows). */
  unhideSelection: (selectedTaskIds: string[]) => void;
  /** Count how many hidden tasks are spanned by the current selection. */
  getHiddenInSelectionCount: (selectedTaskIds: string[]) => number;
}

export function useHideOperations(): UseHideOperationsResult {
  const hideTasks = useChartStore((state) => state.hideTasks);
  const { flattenedTasks, allFlattenedTasks } = useFlattenedTasks();

  const hideRows = useCallback(
    (taskIds: string[]): void => {
      if (taskIds.length === 0) return;

      const previousHiddenTaskIds = [...useChartStore.getState().hiddenTaskIds];
      hideTasks(taskIds);
      useFileStore.getState().markDirty();

      // Count how many were actually hidden (including descendants)
      const newHiddenIds = useChartStore.getState().hiddenTaskIds;
      const newlyHidden = newHiddenIds.length - previousHiddenTaskIds.length;

      const prevSet = new Set(previousHiddenTaskIds);
      useHistoryStore.getState().recordCommand({
        id: crypto.randomUUID(),
        type: CommandType.HIDE_TASKS,
        timestamp: Date.now(),
        description: `Hide ${pluralize(newlyHidden, "task")}`,
        params: {
          taskIds: newHiddenIds.filter((id) => !prevSet.has(id)),
          previousHiddenTaskIds,
        },
      });

      toast.success(`${pluralize(newlyHidden, "task")} hidden`);
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
  }, []);

  const unhideRange = useCallback(
    (fromRowNum: number, toRowNum: number): void => {
      const idsToUnhide = allFlattenedTasks
        .filter(
          (item) =>
            item.globalRowNumber > fromRowNum && item.globalRowNumber < toRowNum
        )
        .map((item) => item.task.id);

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
    },
    [allFlattenedTasks]
  );

  /** Find the row range spanned by selectedTaskIds and return hidden task IDs within. */
  const getHiddenIdsInSelection = useCallback(
    (selectedTaskIds: string[]): string[] => {
      if (selectedTaskIds.length < 2) return [];

      const selectedRowNums = flattenedTasks
        .filter(({ task }) => selectedTaskIds.includes(task.id))
        .map(({ globalRowNumber }) => globalRowNumber)
        .sort((a, b) => a - b);

      if (selectedRowNums.length < 2) return [];

      const firstRow = selectedRowNums[0];
      const lastRow = selectedRowNums[selectedRowNums.length - 1];
      const hiddenSet = new Set(useChartStore.getState().hiddenTaskIds);

      return allFlattenedTasks
        .filter(
          (item) =>
            item.globalRowNumber >= firstRow &&
            item.globalRowNumber <= lastRow &&
            hiddenSet.has(item.task.id)
        )
        .map((item) => item.task.id);
    },
    [flattenedTasks, allFlattenedTasks]
  );

  const getHiddenInSelectionCount = useCallback(
    (selectedTaskIds: string[]): number => {
      return getHiddenIdsInSelection(selectedTaskIds).length;
    },
    [getHiddenIdsInSelection]
  );

  const unhideSelection = useCallback(
    (selectedTaskIds: string[]): void => {
      const idsToUnhide = getHiddenIdsInSelection(selectedTaskIds);
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
    },
    [getHiddenIdsInSelection]
  );

  return {
    hideRows,
    showAll,
    unhideRange,
    unhideSelection,
    getHiddenInSelectionCount,
  };
}
