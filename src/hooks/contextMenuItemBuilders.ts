/**
 * Shared context menu item builders for Zone 1 (row) and Zone 3 (bar).
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
