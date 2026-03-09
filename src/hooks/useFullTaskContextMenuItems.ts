/**
 * Shared hook for building the full task context menu (11-12 items).
 * Used by Zone 1 (TaskTable row), Zone 3 (Timeline bar), and Zone 4 (Timeline area on selected row).
 * Bundles all store subscriptions and provides a buildItems(taskId) function.
 */

import { useCallback, createElement } from "react";
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

// Icon prop objects are derived from static config — defined at module level
// so they are stable references and don't need to be in the useCallback dep array.
const ICON_PROPS = {
  size: CONTEXT_MENU.iconSize,
  weight: CONTEXT_MENU.iconWeight,
} as const;

const SVG_ICON_PROPS = {
  width: CONTEXT_MENU.iconSize,
  height: CONTEXT_MENU.iconSize,
} as const;

// Icons are module-level constants: computed once, stable across all renders and hook instances.
const ICONS = {
  cut: createElement(Scissors, ICON_PROPS),
  copy: createElement(Copy, ICON_PROPS),
  paste: createElement(ClipboardText, ICON_PROPS),
  insertAbove: createElement(RowsPlusTop, ICON_PROPS),
  insertBelow: createElement(RowsPlusBottom, ICON_PROPS),
  trash: createElement(Trash, ICON_PROPS),
  indent: createElement(TextIndent, ICON_PROPS),
  outdent: createElement(TextOutdent, ICON_PROPS),
  group: createElement(GroupIcon, SVG_ICON_PROPS),
  ungroup: createElement(UngroupIcon, SVG_ICON_PROPS),
  eyeSlash: createElement(EyeSlash, ICON_PROPS),
  eye: createElement(Eye, ICON_PROPS),
} as const;

interface UseFullTaskContextMenuItemsResult {
  /** Build the full context menu items for a given task. */
  buildItems: (taskId: TaskId) => ContextMenuItem[];
}

/**
 * Build the full 11–12 item context menu for any task in the chart.
 *
 * Aggregates all store subscriptions (clipboard, hierarchy, hide/unhide) and
 * returns a stable `buildItems(taskId)` function. Callers invoke `buildItems`
 * at right-click time to get the concrete `ContextMenuItem[]` array for the
 * clicked task, taking the current selection into account.
 */
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
  // These selectors call computed methods on the state object. Each method is a
  // pure getter that calls get() internally to read current store state, then
  // returns a primitive boolean. Zustand's default reference-equality check on
  // the returned boolean prevents unnecessary re-renders when the value hasn't
  // changed. This pattern is safe because the methods have no side effects.
  const canIndent = useTaskStore((state) => state.canIndentSelection());
  const canOutdent = useTaskStore((state) => state.canOutdentSelection());
  const canGroup = useTaskStore((state) => state.canGroupSelection());
  const canUngroup = useTaskStore((state) => state.canUngroupSelection());

  const { handleCopy, handleCut, handlePaste, canCopyOrCut, canPaste } =
    useClipboardOperations();
  const { hideRows, unhideSelection, getHiddenInSelectionCount } =
    useHideOperations();

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
          cutIcon: ICONS.cut,
          copyIcon: ICONS.copy,
          pasteIcon: ICONS.paste,
        })
      );

      // Group 2: Insert / Delete
      items.push(
        ...buildInsertItems({
          taskId,
          insertTaskAbove,
          insertTaskBelow,
          insertAboveIcon: ICONS.insertAbove,
          insertBelowIcon: ICONS.insertBelow,
        })
      );
      items.push(
        buildDeleteItem({
          count,
          taskId,
          deleteSelectedTasks,
          deleteTask,
          icon: ICONS.trash,
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
          indentIcon: ICONS.indent,
          outdentIcon: ICONS.outdent,
          groupIcon: ICONS.group,
          ungroupIcon: ICONS.ungroup,
        })
      );

      // Group 4: Visibility
      items.push(
        buildHideItem({
          count,
          effectiveSelection,
          hideRows,
          icon: ICONS.eyeSlash,
        })
      );

      // Unhide — only visible when hidden rows exist in selection range.
      // Extra guard: only show when right-clicking a task within the active
      // multi-selection (avoids showing unhide on a single right-click outside selection).
      const hiddenInRangeCount = getHiddenInSelectionCount(selectedTaskIds);
      const unhideItem = buildUnhideItem({
        hiddenCount: hiddenInRangeCount,
        unhideSelection,
        selectedTaskIds,
        icon: ICONS.eye,
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
      // Store actions below are stable Zustand references; included for exhaustive-deps correctness
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
      // ICONS is intentionally omitted: it is a module-level constant and never changes.
    ]
  );

  return { buildItems };
}
