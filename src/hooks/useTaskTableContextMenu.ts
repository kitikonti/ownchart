/**
 * Hook for building task table context menu items.
 * Extracts menu item logic from TaskTable to reduce component complexity.
 */

import { useMemo, useState, useCallback } from "react";
import type {
  ContextMenuItem,
  ContextMenuPosition,
} from "../components/ContextMenu/ContextMenu";
import { useChartStore } from "../store/slices/chartSlice";
import { useHideOperations } from "./useHideOperations";
import type { FlattenedTask } from "../utils/hierarchy";

interface ContextMenuState {
  position: ContextMenuPosition;
  taskId?: string;
}

interface UseTaskTableContextMenuResult {
  contextMenu: ContextMenuState | null;
  contextMenuItems: ContextMenuItem[];
  handleRowContextMenu: (e: React.MouseEvent, taskId: string) => void;
  closeContextMenu: () => void;
  hideRows: (taskIds: string[]) => void;
  showAll: () => void;
  unhideRange: (fromRowNum: number, toRowNum: number) => void;
}

export function useTaskTableContextMenu(
  selectedTaskIds: string[],
  flattenedTasks: FlattenedTask[],
  allFlattenedTasks: FlattenedTask[]
): UseTaskTableContextMenuResult {
  const hiddenTaskIds = useChartStore((state) => state.hiddenTaskIds);
  const { hideRows, showAll, unhideRange } = useHideOperations();

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleRowContextMenu = useCallback(
    (e: React.MouseEvent, taskId: string): void => {
      e.preventDefault();
      setContextMenu({
        position: { x: e.clientX, y: e.clientY },
        taskId,
      });
    },
    []
  );

  const closeContextMenu = useCallback((): void => {
    setContextMenu(null);
  }, []);

  const contextMenuItems = useMemo((): ContextMenuItem[] => {
    if (!contextMenu?.taskId) return [];

    const items: ContextMenuItem[] = [];

    const taskIdsToHide =
      selectedTaskIds.length > 0 && selectedTaskIds.includes(contextMenu.taskId)
        ? selectedTaskIds
        : [contextMenu.taskId];

    const count = taskIdsToHide.length;
    items.push({
      id: "hide",
      label: count > 1 ? `Hide ${count} Rows` : "Hide Row",
      onClick: () => hideRows(taskIdsToHide),
    });

    // Check if selection spans hidden rows — offer Unhide like Excel
    if (
      selectedTaskIds.length >= 2 &&
      selectedTaskIds.includes(contextMenu.taskId)
    ) {
      const selectedRowNums = flattenedTasks
        .filter(({ task }) => selectedTaskIds.includes(task.id))
        .map(({ globalRowNumber }) => globalRowNumber)
        .sort((a, b) => a - b);

      if (selectedRowNums.length >= 2) {
        const firstRow = selectedRowNums[0];
        const lastRow = selectedRowNums[selectedRowNums.length - 1];
        const hiddenSet = new Set(hiddenTaskIds);
        const hiddenInRangeCount = allFlattenedTasks.filter(
          (item) =>
            item.globalRowNumber >= firstRow &&
            item.globalRowNumber <= lastRow &&
            hiddenSet.has(item.task.id)
        ).length;

        if (hiddenInRangeCount > 0) {
          items.push({
            id: "unhide",
            label: `Unhide ${hiddenInRangeCount} Row${hiddenInRangeCount !== 1 ? "s" : ""}`,
            onClick: (): void => unhideRange(firstRow - 1, lastRow + 1),
          });
        }
      }
    }

    return items;
  }, [
    contextMenu,
    selectedTaskIds,
    hideRows,
    unhideRange,
    flattenedTasks,
    allFlattenedTasks,
    hiddenTaskIds,
  ]);

  return {
    contextMenu,
    contextMenuItems,
    handleRowContextMenu,
    closeContextMenu,
    hideRows,
    showAll,
    unhideRange,
  };
}
