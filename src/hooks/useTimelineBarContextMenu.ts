/**
 * Hook for building timeline bar context menu items (Zone 3).
 * Clipboard + delete/hide actions for task bars in the timeline.
 */

import { useMemo, useState, useCallback, createElement } from "react";
import {
  Scissors,
  Copy,
  ClipboardText,
  Trash,
  EyeSlash,
} from "@phosphor-icons/react";
import type { ContextMenuItem } from "../components/ContextMenu/ContextMenu";
import { useClipboardOperations } from "./useClipboardOperations";
import { useHideOperations } from "./useHideOperations";
import { useTaskStore } from "../store/slices/taskSlice";
import { CONTEXT_MENU } from "../styles/design-tokens";
import type { TaskContextMenuState } from "./contextMenuItemBuilders";
import {
  getEffectiveSelection,
  buildClipboardItems,
  buildDeleteItem,
  buildHideItem,
} from "./contextMenuItemBuilders";

interface UseTimelineBarContextMenuResult {
  contextMenu: TaskContextMenuState | null;
  contextMenuItems: ContextMenuItem[];
  handleBarContextMenu: (e: React.MouseEvent, taskId: string) => void;
  closeContextMenu: () => void;
}

export function useTimelineBarContextMenu(): UseTimelineBarContextMenuResult {
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const setSelectedTaskIds = useTaskStore((state) => state.setSelectedTaskIds);
  const deleteSelectedTasks = useTaskStore(
    (state) => state.deleteSelectedTasks
  );
  const deleteTask = useTaskStore((state) => state.deleteTask);

  const { handleCopy, handleCut, handlePaste, canCopyOrCut, canPaste } =
    useClipboardOperations();
  const { hideRows } = useHideOperations();

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

    const taskId = contextMenu.taskId;
    const { effectiveSelection, count } = getEffectiveSelection(
      taskId,
      selectedTaskIds
    );

    const iconProps = {
      size: CONTEXT_MENU.iconSize,
      weight: CONTEXT_MENU.iconWeight,
    };

    return [
      ...buildClipboardItems({
        handleCut,
        handleCopy,
        handlePaste,
        canCopyOrCut,
        canPaste,
        cutIcon: createElement(Scissors, iconProps),
        copyIcon: createElement(Copy, iconProps),
        pasteIcon: createElement(ClipboardText, iconProps),
      }),
      buildDeleteItem({
        count,
        taskId,
        deleteSelectedTasks,
        deleteTask,
        icon: createElement(Trash, iconProps),
      }),
      buildHideItem({
        count,
        effectiveSelection,
        hideRows,
        icon: createElement(EyeSlash, iconProps),
      }),
    ];
  }, [
    contextMenu,
    selectedTaskIds,
    canCopyOrCut,
    canPaste,
    handleCopy,
    handleCut,
    handlePaste,
    deleteSelectedTasks,
    deleteTask,
    hideRows,
  ]);

  return {
    contextMenu,
    contextMenuItems,
    handleBarContextMenu,
    closeContextMenu,
  };
}
