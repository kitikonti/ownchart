/**
 * Shared context menu item builders for Zone 1 (row), Zone 3 (bar), and Zone 4 (area).
 * Pure functions — no hooks or JSX. Icons are passed in as ReactNode by the caller.
 */

import type { ReactNode } from "react";
import type {
  ContextMenuItem,
  ContextMenuPosition,
} from "@/components/ContextMenu/ContextMenu";
import type { TaskId } from "@/types/branded.types";
import { getModKey } from "@/config/helpContent";

// Computed once at module load — platform is stable for the page lifetime.
const MOD = getModKey();

// ─── Shared types ───

/** State for context menus that target a specific task (Zone 1 + Zone 3). */
export interface TaskContextMenuState {
  position: ContextMenuPosition;
  taskId: TaskId;
}

// ─── Helpers ───

export interface EffectiveSelection {
  effectiveSelection: TaskId[];
  count: number;
}

/** Compute effective selection: use current selection if task is in it, otherwise just the task. */
export function getEffectiveSelection(
  taskId: TaskId,
  selectedTaskIds: TaskId[]
): EffectiveSelection {
  const effectiveSelection = selectedTaskIds.includes(taskId)
    ? selectedTaskIds
    : [taskId];
  return { effectiveSelection, count: effectiveSelection.length };
}

// ─── Builders ───

export interface ClipboardItemsParams {
  handleCut: () => void;
  handleCopy: () => void;
  handlePaste: () => Promise<void>;
  canCopyOrCut: boolean;
  canPaste: boolean;
  cutIcon: ReactNode;
  copyIcon: ReactNode;
  pasteIcon: ReactNode;
  /** Whether to render a visual separator after the Paste item. Defaults to true. */
  hasSeparatorAfterPaste?: boolean;
}

/** Build cut / copy / paste menu items. */
export function buildClipboardItems(
  params: ClipboardItemsParams
): ContextMenuItem[] {
  return [
    {
      id: "cut",
      label: "Cut",
      icon: params.cutIcon,
      shortcut: `${MOD}+X`,
      onClick: params.handleCut,
      disabled: !params.canCopyOrCut,
    },
    {
      id: "copy",
      label: "Copy",
      icon: params.copyIcon,
      shortcut: `${MOD}+C`,
      onClick: params.handleCopy,
      disabled: !params.canCopyOrCut,
    },
    {
      id: "paste",
      label: "Paste",
      icon: params.pasteIcon,
      shortcut: `${MOD}+V`,
      onClick: () => void params.handlePaste(),
      disabled: !params.canPaste,
      separator: params.hasSeparatorAfterPaste ?? true,
    },
  ];
}

export interface DeleteItemParams {
  /** Number of tasks in the effective selection. Must be ≥ 0; item is disabled when 0. */
  count: number;
  taskId: TaskId;
  deleteSelectedTasks: () => void;
  deleteTask: (id: TaskId, cascade?: boolean) => void;
  icon: ReactNode;
  separator?: boolean;
}

/** Build a single delete menu item with singular/plural label. */
export function buildDeleteItem(params: DeleteItemParams): ContextMenuItem {
  return {
    id: "delete",
    label: params.count > 1 ? `Delete ${params.count} Tasks` : "Delete Task",
    icon: params.icon,
    shortcut: "Del",
    onClick: (): void => {
      if (params.count > 1) {
        params.deleteSelectedTasks();
      } else {
        params.deleteTask(params.taskId, true);
      }
    },
    // Defensive guard: count is always ≥ 1 when called via getEffectiveSelection,
    // but external callers may pass 0 (e.g. in tests or future call sites).
    disabled: params.count === 0,
    separator: params.separator,
  };
}

export interface HideItemParams {
  /** Number of tasks in the effective selection. Must be ≥ 0; item is disabled when 0. */
  count: number;
  effectiveSelection: TaskId[];
  hideRows: (taskIds: TaskId[]) => void;
  icon: ReactNode;
}

/** Build a single hide-row menu item with singular/plural label. */
export function buildHideItem(params: HideItemParams): ContextMenuItem {
  return {
    id: "hide",
    label: params.count > 1 ? `Hide ${params.count} Rows` : "Hide Row",
    icon: params.icon,
    shortcut: "Ctrl+H",
    onClick: (): void => params.hideRows(params.effectiveSelection),
    disabled: params.count === 0,
  };
}

export interface InsertItemsParams {
  taskId: TaskId;
  insertTaskAbove: (id: TaskId) => void;
  insertTaskBelow: (id: TaskId) => void;
  insertAboveIcon: ReactNode;
  insertBelowIcon: ReactNode;
}

/** Build insert above / below menu items. */
export function buildInsertItems(params: InsertItemsParams): ContextMenuItem[] {
  return [
    {
      id: "insertAbove",
      label: "Insert Task Above",
      icon: params.insertAboveIcon,
      shortcut: "Ctrl++",
      onClick: (): void => params.insertTaskAbove(params.taskId),
    },
    {
      id: "insertBelow",
      label: "Insert Task Below",
      icon: params.insertBelowIcon,
      onClick: (): void => params.insertTaskBelow(params.taskId),
    },
  ];
}

export interface HierarchyItemsParams {
  canIndent: boolean;
  canOutdent: boolean;
  canGroup: boolean;
  canUngroup: boolean;
  indentSelectedTasks: () => void;
  outdentSelectedTasks: () => void;
  groupSelectedTasks: () => void;
  ungroupSelectedTasks: () => void;
  indentIcon: ReactNode;
  outdentIcon: ReactNode;
  groupIcon: ReactNode;
  ungroupIcon: ReactNode;
}

/** Build indent / outdent / group / ungroup menu items. */
export function buildHierarchyItems(
  params: HierarchyItemsParams
): ContextMenuItem[] {
  return [
    {
      id: "indent",
      label: "Indent",
      icon: params.indentIcon,
      shortcut: "Alt+Shift+→",
      onClick: params.indentSelectedTasks,
      disabled: !params.canIndent,
    },
    {
      id: "outdent",
      label: "Outdent",
      icon: params.outdentIcon,
      shortcut: "Alt+Shift+←",
      onClick: params.outdentSelectedTasks,
      disabled: !params.canOutdent,
    },
    {
      id: "group",
      label: "Group",
      icon: params.groupIcon,
      shortcut: "Ctrl+G",
      onClick: params.groupSelectedTasks,
      disabled: !params.canGroup,
    },
    {
      id: "ungroup",
      label: "Ungroup",
      icon: params.ungroupIcon,
      shortcut: "Ctrl+Shift+G",
      onClick: params.ungroupSelectedTasks,
      disabled: !params.canUngroup,
      separator: true,
    },
  ];
}

export interface UnhideItemParams {
  hiddenCount: number;
  unhideSelection: (selectedTaskIds: TaskId[]) => void;
  selectedTaskIds: TaskId[];
  icon: ReactNode;
}

/**
 * Build an unhide menu item (only visible when hidden rows exist in selection range).
 * Requires at least 2 selected tasks because a hidden row can only exist *between*
 * two selected rows — a single selected task has no range to contain hidden rows.
 */
export function buildUnhideItem(
  params: UnhideItemParams
): ContextMenuItem | null {
  if (params.hiddenCount === 0 || params.selectedTaskIds.length < 2) {
    return null;
  }
  return {
    id: "unhide",
    label: `Unhide ${params.hiddenCount} Row${params.hiddenCount !== 1 ? "s" : ""}`,
    icon: params.icon,
    shortcut: "Ctrl+Shift+H",
    onClick: () => params.unhideSelection(params.selectedTaskIds),
  };
}
