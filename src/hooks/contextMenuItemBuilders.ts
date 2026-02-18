/**
 * Shared context menu item builders for Zone 1 (row), Zone 3 (bar), and Zone 4 (area).
 * Pure functions — icons are passed in as ReactNode so builders stay framework-free.
 */

import type {
  ContextMenuItem,
  ContextMenuPosition,
} from "../components/ContextMenu/ContextMenu";

// ─── Shared types ───

/** State for context menus that target a specific task (Zone 1 + Zone 3). */
export interface TaskContextMenuState {
  position: ContextMenuPosition;
  taskId: string;
}

// ─── Helpers ───

/** Compute effective selection: use current selection if task is in it, otherwise just the task. */
export function getEffectiveSelection(
  taskId: string,
  selectedTaskIds: string[]
): { effectiveSelection: string[]; count: number } {
  const effectiveSelection = selectedTaskIds.includes(taskId)
    ? selectedTaskIds
    : [taskId];
  return { effectiveSelection, count: effectiveSelection.length };
}

// ─── Builders ───

interface ClipboardItemsParams {
  handleCut: () => void;
  handleCopy: () => void;
  handlePaste: () => Promise<void>;
  canCopyOrCut: boolean;
  canPaste: boolean;
  cutIcon: React.ReactNode;
  copyIcon: React.ReactNode;
  pasteIcon: React.ReactNode;
  pasteSeparator?: boolean;
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
      shortcut: "Ctrl+X",
      onClick: params.handleCut,
      disabled: !params.canCopyOrCut,
    },
    {
      id: "copy",
      label: "Copy",
      icon: params.copyIcon,
      shortcut: "Ctrl+C",
      onClick: params.handleCopy,
      disabled: !params.canCopyOrCut,
    },
    {
      id: "paste",
      label: "Paste",
      icon: params.pasteIcon,
      shortcut: "Ctrl+V",
      onClick: () => void params.handlePaste(),
      disabled: !params.canPaste,
      separator: params.pasteSeparator ?? true,
    },
  ];
}

interface DeleteItemParams {
  count: number;
  taskId: string;
  deleteSelectedTasks: () => void;
  deleteTask: (id: string, record: boolean) => void;
  icon: React.ReactNode;
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
    disabled: params.count === 0,
    separator: params.separator,
  };
}

interface HideItemParams {
  count: number;
  effectiveSelection: string[];
  hideRows: (taskIds: string[]) => void;
  icon: React.ReactNode;
}

/** Build a single hide-row menu item with singular/plural label. */
export function buildHideItem(params: HideItemParams): ContextMenuItem {
  return {
    id: "hide",
    label: params.count > 1 ? `Hide ${params.count} Rows` : "Hide Row",
    icon: params.icon,
    shortcut: "Ctrl+H",
    onClick: () => params.hideRows(params.effectiveSelection),
    disabled: params.count === 0,
  };
}

interface InsertItemsParams {
  taskId: string;
  insertTaskAbove: (id: string) => void;
  insertTaskBelow: (id: string) => void;
  insertAboveIcon: React.ReactNode;
  insertBelowIcon: React.ReactNode;
}

/** Build insert above / below menu items. */
export function buildInsertItems(params: InsertItemsParams): ContextMenuItem[] {
  return [
    {
      id: "insertAbove",
      label: "Insert Task Above",
      icon: params.insertAboveIcon,
      shortcut: "Ctrl++",
      onClick: () => params.insertTaskAbove(params.taskId),
    },
    {
      id: "insertBelow",
      label: "Insert Task Below",
      icon: params.insertBelowIcon,
      onClick: () => params.insertTaskBelow(params.taskId),
    },
  ];
}

interface HierarchyItemsParams {
  canIndent: boolean;
  canOutdent: boolean;
  canGroup: boolean;
  canUngroup: boolean;
  indentSelectedTasks: () => void;
  outdentSelectedTasks: () => void;
  groupSelectedTasks: () => void;
  ungroupSelectedTasks: () => void;
  indentIcon: React.ReactNode;
  outdentIcon: React.ReactNode;
  groupIcon: React.ReactNode;
  ungroupIcon: React.ReactNode;
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

interface UnhideItemParams {
  hiddenCount: number;
  unhideSelection: (selectedTaskIds: string[]) => void;
  selectedTaskIds: string[];
  icon: React.ReactNode;
}

/** Build an unhide menu item (only visible when hidden rows exist in selection range). */
export function buildUnhideItem(
  params: UnhideItemParams
): ContextMenuItem | null {
  if (params.hiddenCount <= 0 || params.selectedTaskIds.length < 2) {
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
