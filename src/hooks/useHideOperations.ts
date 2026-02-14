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

interface UseHideOperationsResult {
  /** Hide tasks by IDs (includes descendants for summary tasks). Records undo command. */
  hideRows: (taskIds: string[]) => void;
  /** Unhide all hidden tasks. Records undo command. */
  showAll: () => void;
  /** Unhide tasks whose globalRowNumber falls within a gap range. Records undo command. */
  unhideRange: (fromRowNum: number, toRowNum: number) => void;
}

export function useHideOperations(): UseHideOperationsResult {
  const hiddenTaskIds = useChartStore((state) => state.hiddenTaskIds);
  const hideTasks = useChartStore((state) => state.hideTasks);
  const { allFlattenedTasks } = useFlattenedTasks();

  const hideRows = useCallback(
    (taskIds: string[]): void => {
      if (taskIds.length === 0) return;

      const previousHiddenTaskIds = [...hiddenTaskIds];
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
        description: `Hide ${newlyHidden} task${newlyHidden !== 1 ? "s" : ""}`,
        params: {
          taskIds: newHiddenIds.filter((id) => !prevSet.has(id)),
          previousHiddenTaskIds,
        },
      });

      toast.success(
        `${newlyHidden} task${newlyHidden !== 1 ? "s" : ""} hidden`
      );
    },
    [hiddenTaskIds, hideTasks]
  );

  const showAll = useCallback((): void => {
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
  }, [hiddenTaskIds]);

  const unhideRange = useCallback(
    (fromRowNum: number, toRowNum: number): void => {
      const idsToUnhide = allFlattenedTasks
        .filter(
          (item) =>
            item.globalRowNumber > fromRowNum && item.globalRowNumber < toRowNum
        )
        .map((item) => item.task.id);

      if (idsToUnhide.length === 0) return;

      const previousHiddenTaskIds = [...hiddenTaskIds];
      useChartStore.getState().unhideTasks(idsToUnhide);
      useFileStore.getState().markDirty();

      useHistoryStore.getState().recordCommand({
        id: crypto.randomUUID(),
        type: CommandType.UNHIDE_TASKS,
        timestamp: Date.now(),
        description: `Show ${idsToUnhide.length} hidden task${idsToUnhide.length !== 1 ? "s" : ""}`,
        params: {
          taskIds: idsToUnhide,
          previousHiddenTaskIds,
        },
      });

      toast.success(
        `${idsToUnhide.length} task${idsToUnhide.length !== 1 ? "s" : ""} shown`
      );
    },
    [allFlattenedTasks, hiddenTaskIds]
  );

  return { hideRows, showAll, unhideRange };
}
