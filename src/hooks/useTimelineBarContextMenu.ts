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
import type {
  ContextMenuItem,
  ContextMenuPosition,
} from "../components/ContextMenu/ContextMenu";
import { useClipboardOperations } from "./useClipboardOperations";
import { useHideOperations } from "./useHideOperations";
import { useTaskStore } from "../store/slices/taskSlice";

const ICON_SIZE = 20;
const ICON_WEIGHT = "light" as const;

interface ContextMenuState {
  position: ContextMenuPosition;
  taskId: string;
}

interface UseTimelineBarContextMenuResult {
  contextMenu: ContextMenuState | null;
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

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleBarContextMenu = useCallback(
    (e: React.MouseEvent, taskId: string): void => {
      e.preventDefault();
      e.stopPropagation(); // Prevent timeline area context menu

      // Right-click selection logic
      if (!selectedTaskIds.includes(taskId)) {
        setSelectedTaskIds([taskId]);
      }

      setContextMenu({
        position: { x: e.clientX, y: e.clientY },
        taskId,
      });
    },
    [selectedTaskIds, setSelectedTaskIds]
  );

  const closeContextMenu = useCallback((): void => {
    setContextMenu(null);
  }, []);

  const contextMenuItems = useMemo((): ContextMenuItem[] => {
    if (!contextMenu) return [];

    const taskId = contextMenu.taskId;
    const effectiveSelection = selectedTaskIds.includes(taskId)
      ? selectedTaskIds
      : [taskId];
    const count = effectiveSelection.length;

    const items: ContextMenuItem[] = [];

    // ── Group 1: Clipboard ──
    items.push({
      id: "cut",
      label: "Cut",
      icon: createElement(Scissors, { size: ICON_SIZE, weight: ICON_WEIGHT }),
      shortcut: "Ctrl+X",
      onClick: handleCut,
      disabled: !canCopyOrCut,
    });
    items.push({
      id: "copy",
      label: "Copy",
      icon: createElement(Copy, { size: ICON_SIZE, weight: ICON_WEIGHT }),
      shortcut: "Ctrl+C",
      onClick: handleCopy,
      disabled: !canCopyOrCut,
    });
    items.push({
      id: "paste",
      label: "Paste",
      icon: createElement(ClipboardText, {
        size: ICON_SIZE,
        weight: ICON_WEIGHT,
      }),
      shortcut: "Ctrl+V",
      onClick: () => void handlePaste(),
      disabled: !canPaste,
      separator: true,
    });

    // ── Group 2: Actions ──
    items.push({
      id: "delete",
      label: count > 1 ? `Delete ${count} Tasks` : "Delete Task",
      icon: createElement(Trash, { size: ICON_SIZE, weight: ICON_WEIGHT }),
      shortcut: "Del",
      onClick: () => {
        if (count > 1) {
          deleteSelectedTasks();
        } else {
          deleteTask(taskId, true);
        }
      },
      disabled: count === 0,
    });
    items.push({
      id: "hide",
      label: count > 1 ? `Hide ${count} Rows` : "Hide Row",
      icon: createElement(EyeSlash, { size: ICON_SIZE, weight: ICON_WEIGHT }),
      shortcut: "Ctrl+H",
      onClick: () => hideRows(effectiveSelection),
      disabled: count === 0,
    });

    return items;
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
