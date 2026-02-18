/**
 * Hook for building task table row context menu items (Zone 1).
 * Full context menu with clipboard, insert, hierarchy, and visibility groups.
 * Delegates item building to useFullTaskContextMenuItems.
 */

import { useMemo, useState, useCallback } from "react";
import type { ContextMenuItem } from "../components/ContextMenu/ContextMenu";
import { useTaskStore } from "../store/slices/taskSlice";
import type { TaskContextMenuState } from "./contextMenuItemBuilders";
import { useFullTaskContextMenuItems } from "./useFullTaskContextMenuItems";

interface UseTaskTableRowContextMenuResult {
  contextMenu: TaskContextMenuState | null;
  contextMenuItems: ContextMenuItem[];
  handleRowContextMenu: (e: React.MouseEvent, taskId: string) => void;
  closeContextMenu: () => void;
}

export function useTaskTableRowContextMenu(): UseTaskTableRowContextMenuResult {
  const setSelectedTaskIds = useTaskStore((state) => state.setSelectedTaskIds);
  const { buildItems } = useFullTaskContextMenuItems();

  const [contextMenu, setContextMenu] = useState<TaskContextMenuState | null>(
    null
  );

  const handleRowContextMenu = useCallback(
    (e: React.MouseEvent, taskId: string): void => {
      e.preventDefault();

      // Right-click selection logic:
      // If task is not in current selection, switch selection to this task
      if (!useTaskStore.getState().selectedTaskIds.includes(taskId)) {
        setSelectedTaskIds([taskId]);
      }

      setContextMenu({
        position: { x: e.clientX, y: e.clientY },
        taskId,
      });
    },
    [setSelectedTaskIds]
  );

  const closeContextMenu = useCallback((): void => {
    setContextMenu(null);
  }, []);

  const contextMenuItems = useMemo((): ContextMenuItem[] => {
    if (!contextMenu) return [];
    return buildItems(contextMenu.taskId);
  }, [contextMenu, buildItems]);

  return {
    contextMenu,
    contextMenuItems,
    handleRowContextMenu,
    closeContextMenu,
  };
}
