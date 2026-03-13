/**
 * Hook for building task table row context menu items (Zone 1).
 * Full context menu with clipboard, insert, hierarchy, and visibility groups.
 * Delegates item building to useFullTaskContextMenuItems.
 */

import { useMemo, useState, useCallback } from "react";
import type { ContextMenuItem } from "@/components/ContextMenu/ContextMenu";
import type { TaskId } from "@/types/branded.types";
import { useTaskStore } from "@/store/slices/taskSlice";
import type { TaskContextMenuState } from "./contextMenuItemBuilders";
import { useFullTaskContextMenuItems } from "./useFullTaskContextMenuItems";

export interface UseTaskTableRowContextMenuResult {
  contextMenu: TaskContextMenuState | null;
  contextMenuItems: ContextMenuItem[];
  handleRowContextMenu: (e: React.MouseEvent, taskId: TaskId) => void;
  closeContextMenu: () => void;
}

export function useTaskTableRowContextMenu(): UseTaskTableRowContextMenuResult {
  const setSelectedTaskIds = useTaskStore((state) => state.setSelectedTaskIds);
  // selectedTaskIds subscription: we need the current selection to decide
  // whether to extend or replace it on right-click. Re-renders on selection
  // change are acceptable here — this hook is not in a hot render path.
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const { buildItems } = useFullTaskContextMenuItems();

  const [contextMenu, setContextMenu] = useState<TaskContextMenuState | null>(
    null
  );

  // Set for O(1) membership checks in the right-click handler
  const selectedTaskIdSet = useMemo(
    () => new Set(selectedTaskIds),
    [selectedTaskIds]
  );

  const handleRowContextMenu = useCallback(
    (e: React.MouseEvent, taskId: TaskId): void => {
      e.preventDefault();

      // Right-click selection logic:
      // If task is not in current selection, switch selection to this task
      if (!selectedTaskIdSet.has(taskId)) {
        setSelectedTaskIds([taskId]);
      }

      setContextMenu({
        position: { x: e.clientX, y: e.clientY },
        taskId,
      });
    },
    [selectedTaskIdSet, setSelectedTaskIds]
  );

  const closeContextMenu = useCallback((): void => {
    setContextMenu(null);
  }, []);

  // Depend only on taskId (not the full contextMenu object) so that a future
  // position-only update (e.g. viewport correction) does not recompute items.
  const contextMenuTaskId = contextMenu?.taskId;
  const contextMenuItems = useMemo((): ContextMenuItem[] => {
    if (!contextMenuTaskId) return [];
    return buildItems(contextMenuTaskId);
  }, [contextMenuTaskId, buildItems]);

  return {
    contextMenu,
    contextMenuItems,
    handleRowContextMenu,
    closeContextMenu,
  };
}
