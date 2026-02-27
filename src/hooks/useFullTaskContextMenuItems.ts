/**
 * Shared hook for building the full task context menu (11-12 items).
 * Used by Zone 1 (TaskTable row), Zone 3 (Timeline bar), and Zone 4 (Timeline area on selected row).
 * Bundles all store subscriptions and provides a buildItems(taskId) function.
 */

import { useMemo, useCallback, createElement } from "react";
import {
  Scissors,
  Copy,
  ClipboardText,
  RowsPlusTop,
  RowsPlusBottom,
  Trash,
  TextIndent,
  TextOutdent,
  EyeSlash,
  Eye,
} from "@phosphor-icons/react";
import GroupIcon from "../assets/icons/group-light.svg?react";
import UngroupIcon from "../assets/icons/ungroup-light.svg?react";
import type { ContextMenuItem } from "../components/ContextMenu/ContextMenu";
import type { TaskId } from "../types/branded.types";
import { useClipboardOperations } from "./useClipboardOperations";
import { useHideOperations } from "./useHideOperations";
import { useTaskStore } from "../store/slices/taskSlice";
import { CONTEXT_MENU } from "../styles/design-tokens";
import {
  getEffectiveSelection,
  buildClipboardItems,
  buildInsertItems,
  buildDeleteItem,
  buildHierarchyItems,
  buildHideItem,
  buildUnhideItem,
} from "./contextMenuItemBuilders";

interface UseFullTaskContextMenuItemsResult {
  /** Build the full context menu items for a given task. */
  buildItems: (taskId: TaskId) => ContextMenuItem[];
}

export function useFullTaskContextMenuItems(): UseFullTaskContextMenuItemsResult {
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
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
  const ungroupSelectedTasks = useTaskStore(
    (state) => state.ungroupSelectedTasks
  );
  const canIndent = useTaskStore((state) => state.canIndentSelection());
  const canOutdent = useTaskStore((state) => state.canOutdentSelection());
  const canGroup = useTaskStore((state) => state.canGroupSelection());
  const canUngroup = useTaskStore((state) => state.canUngroupSelection());

  const { handleCopy, handleCut, handlePaste, canCopyOrCut, canPaste } =
    useClipboardOperations();
  const { hideRows, unhideSelection, getHiddenInSelectionCount } =
    useHideOperations();

  const iconProps = useMemo(
    () => ({
      size: CONTEXT_MENU.iconSize,
      weight: CONTEXT_MENU.iconWeight,
    }),
    []
  );

  const svgIconProps = useMemo(
    () => ({
      width: CONTEXT_MENU.iconSize,
      height: CONTEXT_MENU.iconSize,
    }),
    []
  );

  const buildItems = useCallback(
    (taskId: TaskId): ContextMenuItem[] => {
      const { effectiveSelection, count } = getEffectiveSelection(
        taskId,
        selectedTaskIds
      );

      const items: ContextMenuItem[] = [];

      // Group 1: Clipboard
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

      // Group 2: Insert / Delete
      items.push(
        ...buildInsertItems({
          taskId,
          insertTaskAbove,
          insertTaskBelow,
          insertAboveIcon: createElement(RowsPlusTop, iconProps),
          insertBelowIcon: createElement(RowsPlusBottom, iconProps),
        })
      );
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

      // Group 3: Hierarchy
      items.push(
        ...buildHierarchyItems({
          canIndent,
          canOutdent,
          canGroup,
          canUngroup,
          indentSelectedTasks,
          outdentSelectedTasks,
          groupSelectedTasks,
          ungroupSelectedTasks,
          indentIcon: createElement(TextIndent, iconProps),
          outdentIcon: createElement(TextOutdent, iconProps),
          groupIcon: createElement(GroupIcon, svgIconProps),
          ungroupIcon: createElement(UngroupIcon, svgIconProps),
        })
      );

      // Group 4: Visibility
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
      const unhideItem = buildUnhideItem({
        hiddenCount: hiddenInRangeCount,
        unhideSelection,
        selectedTaskIds,
        icon: createElement(Eye, iconProps),
      });
      if (unhideItem && selectedTaskIds.includes(taskId)) {
        items.push(unhideItem);
      }

      return items;
    },
    [
      selectedTaskIds,
      canCopyOrCut,
      canPaste,
      canIndent,
      canOutdent,
      canGroup,
      canUngroup,
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
      ungroupSelectedTasks,
      hideRows,
      unhideSelection,
      getHiddenInSelectionCount,
      iconProps,
      svgIconProps,
    ]
  );

  return { buildItems };
}
