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

interface UseTaskTableRowContextMenuResult {
  contextMenu: TaskContextMenuState | null;
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

    const taskId = contextMenu.taskId;
    const { effectiveSelection, count } = getEffectiveSelection(
      taskId,
      selectedTaskIds
    );

    const iconProps = {
      size: CONTEXT_MENU.iconSize,
      weight: CONTEXT_MENU.iconWeight,
    };

    const items: ContextMenuItem[] = [];

    // ── Group 1: Clipboard ──
    items.push(
      ...buildClipboardItems({
        handleCut,
        handleCopy,
        handlePaste,
        canCopyOrCut,
        canPaste,
        cutIcon: createElement(Scissors, iconProps),
        copyIcon: createElement(Copy, iconProps),
        pasteIcon: createElement(ClipboardText, iconProps),
      })
    );

    // ── Group 2: Insert / Delete ──
    items.push({
      id: "insertAbove",
      label: "Insert Task Above",
      icon: createElement(RowsPlusTop, iconProps),
      shortcut: "Ctrl++",
      onClick: () => insertTaskAbove(taskId),
    });
    items.push({
      id: "insertBelow",
      label: "Insert Task Below",
      icon: createElement(RowsPlusBottom, iconProps),
      onClick: () => insertTaskBelow(taskId),
    });
    items.push(
      buildDeleteItem({
        count,
        taskId,
        deleteSelectedTasks,
        deleteTask,
        icon: createElement(Trash, iconProps),
        separator: true,
      })
    );

    // ── Group 3: Hierarchy ──
    items.push({
      id: "indent",
      label: "Indent",
      icon: createElement(TextIndent, iconProps),
      shortcut: "Alt+Shift+→",
      onClick: indentSelectedTasks,
      disabled: !canIndent,
    });
    items.push({
      id: "outdent",
      label: "Outdent",
      icon: createElement(TextOutdent, iconProps),
      shortcut: "Alt+Shift+←",
      onClick: outdentSelectedTasks,
      disabled: !canOutdent,
    });
    items.push({
      id: "group",
      label: "Group",
      icon: createElement(BoundingBox, iconProps),
      shortcut: "Ctrl+G",
      onClick: groupSelectedTasks,
      disabled: !canGroup,
      separator: true,
    });

    // ── Group 4: Visibility ──
    items.push(
      buildHideItem({
        count,
        effectiveSelection,
        hideRows,
        icon: createElement(EyeSlash, iconProps),
      })
    );

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
        icon: createElement(Eye, iconProps),
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
