/**
 * Hook for building timeline bar context menu items (Zone 3).
 * Full context menu — same items as Zone 1 (TaskTable row).
 * Delegates item building to useFullTaskContextMenuItems.
 */

import { useMemo, useState, useCallback } from "react";
import type { ContextMenuItem } from "../components/ContextMenu/ContextMenu";
import { useTaskStore } from "../store/slices/taskSlice";
import type { TaskContextMenuState } from "./contextMenuItemBuilders";
import { useFullTaskContextMenuItems } from "./useFullTaskContextMenuItems";

interface UseTimelineBarContextMenuResult {
  contextMenu: TaskContextMenuState | null;
  contextMenuItems: ContextMenuItem[];
  handleBarContextMenu: (e: React.MouseEvent, taskId: string) => void;
  closeContextMenu: () => void;
}

export function useTimelineBarContextMenu(): UseTimelineBarContextMenuResult {
  const setSelectedTaskIds = useTaskStore((state) => state.setSelectedTaskIds);
  const { buildItems } = useFullTaskContextMenuItems();

  const [contextMenu, setContextMenu] = useState<TaskContextMenuState | null>(
    null
  );

  const handleBarContextMenu = useCallback(
    (e: React.MouseEvent, taskId: string): void => {
      e.preventDefault();
      e.stopPropagation(); // Prevent timeline area context menu

      // Right-click selection logic
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
    handleBarContextMenu,
    closeContextMenu,
  };
}
