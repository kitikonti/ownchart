/**
 * Hook for building task table row context menu items (Zone 1).
 * Full context menu with clipboard, insert, hierarchy, and visibility groups.
 */

import { useMemo, useState, useCallback, createElement } from "react";
import {
  Scissors,
  Copy,
  ClipboardText,
  RowsPlusTop,
  RowsPlusBottom,
  Trash,
  TextIndent,
  TextOutdent,
  BoundingBox,
  EyeSlash,
  Eye,
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

interface UseTaskTableRowContextMenuResult {
  contextMenu: ContextMenuState | null;
  contextMenuItems: ContextMenuItem[];
  handleRowContextMenu: (e: React.MouseEvent, taskId: string) => void;
  closeContextMenu: () => void;
}

export function useTaskTableRowContextMenu(): UseTaskTableRowContextMenuResult {
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const setSelectedTaskIds = useTaskStore((state) => state.setSelectedTaskIds);
  const insertTaskAbove = useTaskStore((state) => state.insertTaskAbove);
  const insertTaskBelow = useTaskStore((state) => state.insertTaskBelow);
  const deleteSelectedTasks = useTaskStore(
    (state) => state.deleteSelectedTasks
  );
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const indentSelectedTasks = useTaskStore(
    (state) => state.indentSelectedTasks
  );
  const outdentSelectedTasks = useTaskStore(
    (state) => state.outdentSelectedTasks
  );
  const groupSelectedTasks = useTaskStore((state) => state.groupSelectedTasks);
  const canIndent = useTaskStore((state) => state.canIndentSelection());
  const canOutdent = useTaskStore((state) => state.canOutdentSelection());
  const canGroup = useTaskStore((state) => state.canGroupSelection());

  const { handleCopy, handleCut, handlePaste, canCopyOrCut, canPaste } =
    useClipboardOperations();
  const { hideRows, unhideSelection, getHiddenInSelectionCount } =
    useHideOperations();

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleRowContextMenu = useCallback(
    (e: React.MouseEvent, taskId: string): void => {
      e.preventDefault();

      // Right-click selection logic:
      // If task is not in current selection, switch selection to this task
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

    // Effective selection: if right-clicked task is in selection, use selection;
    // otherwise just this one task (selection already switched in handleRowContextMenu)
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

    // ── Group 2: Insert / Delete ──
    items.push({
      id: "insertAbove",
      label: "Insert Task Above",
      icon: createElement(RowsPlusTop, {
        size: ICON_SIZE,
        weight: ICON_WEIGHT,
      }),
      shortcut: "Ctrl++",
      onClick: () => insertTaskAbove(taskId),
    });
    items.push({
      id: "insertBelow",
      label: "Insert Task Below",
      icon: createElement(RowsPlusBottom, {
        size: ICON_SIZE,
        weight: ICON_WEIGHT,
      }),
      onClick: () => insertTaskBelow(taskId),
    });
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
      separator: true,
    });

    // ── Group 3: Hierarchy ──
    items.push({
      id: "indent",
      label: "Indent",
      icon: createElement(TextIndent, {
        size: ICON_SIZE,
        weight: ICON_WEIGHT,
      }),
      shortcut: "Alt+Shift+→",
      onClick: indentSelectedTasks,
      disabled: !canIndent,
    });
    items.push({
      id: "outdent",
      label: "Outdent",
      icon: createElement(TextOutdent, {
        size: ICON_SIZE,
        weight: ICON_WEIGHT,
      }),
      shortcut: "Alt+Shift+←",
      onClick: outdentSelectedTasks,
      disabled: !canOutdent,
    });
    items.push({
      id: "group",
      label: "Group",
      icon: createElement(BoundingBox, {
        size: ICON_SIZE,
        weight: ICON_WEIGHT,
      }),
      shortcut: "Ctrl+G",
      onClick: groupSelectedTasks,
      disabled: !canGroup,
      separator: true,
    });

    // ── Group 4: Visibility ──
    items.push({
      id: "hide",
      label: count > 1 ? `Hide ${count} Rows` : "Hide Row",
      icon: createElement(EyeSlash, { size: ICON_SIZE, weight: ICON_WEIGHT }),
      shortcut: "Ctrl+H",
      onClick: () => hideRows(effectiveSelection),
      disabled: count === 0,
    });

    // Unhide — only visible when hidden rows exist in selection range
    const hiddenInRangeCount = getHiddenInSelectionCount(selectedTaskIds);
    if (
      hiddenInRangeCount > 0 &&
      selectedTaskIds.length >= 2 &&
      selectedTaskIds.includes(taskId)
    ) {
      items.push({
        id: "unhide",
        label: `Unhide ${hiddenInRangeCount} Row${hiddenInRangeCount !== 1 ? "s" : ""}`,
        icon: createElement(Eye, { size: ICON_SIZE, weight: ICON_WEIGHT }),
        shortcut: "Ctrl+Shift+H",
        onClick: () => unhideSelection(selectedTaskIds),
      });
    }

    return items;
  }, [
    contextMenu,
    selectedTaskIds,
    canCopyOrCut,
    canPaste,
    canIndent,
    canOutdent,
    canGroup,
    handleCopy,
    handleCut,
    handlePaste,
    insertTaskAbove,
    insertTaskBelow,
    deleteSelectedTasks,
    deleteTask,
    indentSelectedTasks,
    outdentSelectedTasks,
    groupSelectedTasks,
    hideRows,
    unhideSelection,
    getHiddenInSelectionCount,
  ]);

  return {
    contextMenu,
    contextMenuItems,
    handleRowContextMenu,
    closeContextMenu,
  };
}
