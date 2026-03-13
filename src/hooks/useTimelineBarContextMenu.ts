/**
 * Hook for building timeline bar context menu items (Zone 3).
 * Full context menu — same items as Zone 1 (TaskTable row).
 * Delegates item building to useFullTaskContextMenuItems.
 */

import { useCallback, useMemo, useState } from "react";
import { useTaskStore } from "@/store/slices/taskSlice";
import { useFullTaskContextMenuItems } from "./useFullTaskContextMenuItems";
import type { MouseEvent } from "react";
import type { ContextMenuItem } from "@/components/ContextMenu/ContextMenu";
import type { TaskId } from "@/types/branded.types";
import type { TaskContextMenuState } from "./contextMenuItemBuilders";

interface UseTimelineBarContextMenuResult {
  contextMenu: TaskContextMenuState | null;
  contextMenuItems: ContextMenuItem[];
  handleBarContextMenu: (e: MouseEvent, taskId: TaskId) => void;
  closeContextMenu: () => void;
}

export function useTimelineBarContextMenu(): UseTimelineBarContextMenuResult {
  const setSelectedTaskIds = useTaskStore((state) => state.setSelectedTaskIds);
  const { buildItems } = useFullTaskContextMenuItems();

  const [contextMenu, setContextMenu] = useState<TaskContextMenuState | null>(
    null
  );

  const handleBarContextMenu = useCallback(
    (e: MouseEvent, taskId: TaskId): void => {
      e.preventDefault();
      e.stopPropagation(); // Prevent timeline area context menu

      // Right-click selection logic: if the clicked task is not in the current
      // selection, replace the selection with just that task.
      // Use a Set for O(1) lookup instead of O(n) Array.includes.
      const currentSelection = new Set(useTaskStore.getState().selectedTaskIds);
      if (!currentSelection.has(taskId)) {
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
