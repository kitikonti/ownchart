/**
 * Hook for building task table context menu items.
 * Extracts menu item logic from TaskTable to reduce component complexity.
 */

import { useMemo, useState, useCallback, createElement } from "react";
import { EyeSlash, Eye } from "@phosphor-icons/react";
import type {
  ContextMenuItem,
  ContextMenuPosition,
} from "../components/ContextMenu/ContextMenu";
import { useHideOperations } from "./useHideOperations";

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
  unhideSelection: (selectedTaskIds: string[]) => void;
  unhideRange: (fromRowNum: number, toRowNum: number) => void;
}

export function useTaskTableContextMenu(
  selectedTaskIds: string[]
): UseTaskTableContextMenuResult {
  const { hideRows, unhideRange, unhideSelection, getHiddenInSelectionCount } =
    useHideOperations();

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
      icon: createElement(EyeSlash, { size: 20, weight: "light" }),
      shortcut: "Ctrl+H",
      onClick: () => hideRows(taskIdsToHide),
    });

    // Check if selection spans hidden rows — offer Unhide like Excel
    const hiddenInRangeCount = getHiddenInSelectionCount(selectedTaskIds);
    if (
      hiddenInRangeCount > 0 &&
      selectedTaskIds.length >= 2 &&
      selectedTaskIds.includes(contextMenu.taskId)
    ) {
      items.push({
        id: "unhide",
        label: `Unhide ${hiddenInRangeCount} Row${hiddenInRangeCount !== 1 ? "s" : ""}`,
        icon: createElement(Eye, { size: 20, weight: "light" }),
        shortcut: "Ctrl+Shift+H",
        onClick: (): void => unhideSelection(selectedTaskIds),
      });
    }

    return items;
  }, [
    contextMenu,
    selectedTaskIds,
    hideRows,
    unhideSelection,
    getHiddenInSelectionCount,
  ]);

  return {
    contextMenu,
    contextMenuItems,
    handleRowContextMenu,
    closeContextMenu,
    hideRows,
    unhideSelection,
    unhideRange,
  };
}
