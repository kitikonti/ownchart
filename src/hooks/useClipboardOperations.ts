/**
 * Custom hook for clipboard operations (copy/cut/paste).
 * Centralizes clipboard logic used by both keyboard shortcuts and toolbar buttons.
 * Supports both row-level and cell-level operations with smart mode detection.
 * Integrates with system clipboard for cross-tab copy/paste.
 */

import { useCallback } from "react";
import toast from "react-hot-toast";
import { useClipboardStore } from "../store/slices/clipboardSlice";
import { useTaskStore } from "../store/slices/taskSlice";
import type { TaskId } from "../types/branded.types";
import type { EditableField } from "../types/task.types";
import {
  writeRowsToSystemClipboard,
  writeCellToSystemClipboard,
  readRowsFromSystemClipboard,
  readCellFromSystemClipboard,
  isClipboardApiAvailable,
} from "../utils/clipboard";

export interface ClipboardOperations {
  handleCopy: () => void;
  handleCut: () => void;
  handlePaste: () => Promise<void>;
  canCopyOrCut: boolean;
  canPaste: boolean;
}

/**
 * Returns true if two task arrays represent the same ordered sequence of IDs.
 * Used to detect when the system clipboard holds data already present in the
 * internal clipboard, preventing accidental double-paste across tabs.
 * @internal exported for testing
 */
export function hasSameTaskIds(
  a: readonly { id: unknown }[],
  b: readonly { id: unknown }[]
): boolean {
  return a.length === b.length && a.every((item, i) => item.id === b[i].id);
}

// ---------------------------------------------------------------------------
// Module-level helpers — read fresh store state via getState() so they never
// need to be part of a useCallback dependency array.
// ---------------------------------------------------------------------------

/**
 * Fire-and-forget: sync the current row clipboard to the system clipboard.
 * Silently swallows errors — the internal clipboard always serves as fallback.
 */
function syncRowsToSystemClipboard(): void {
  if (!isClipboardApiAvailable()) return;
  const { rowClipboard } = useClipboardStore.getState();
  writeRowsToSystemClipboard(
    rowClipboard.tasks,
    rowClipboard.dependencies
  ).catch(() => {
    // Silently fail — internal clipboard still works
  });
}

/**
 * Fire-and-forget: sync the current cell clipboard to the system clipboard.
 * Silently swallows errors — the internal clipboard always serves as fallback.
 */
function syncCellToSystemClipboard(): void {
  if (!isClipboardApiAvailable()) return;
  const { cellClipboard } = useClipboardStore.getState();
  if (cellClipboard.field && cellClipboard.value != null) {
    writeCellToSystemClipboard(cellClipboard.value, cellClipboard.field).catch(
      () => {
        // Silently fail — internal clipboard still works
      }
    );
  }
}

/**
 * Shared implementation for copy and cut — rows take priority over cell.
 * Extracted to eliminate the structural duplication between handleCopy and
 * handleCut (they differ only in which store action they call and the verb).
 */
function executeCopyOrCut(
  mode: "copy" | "cut",
  selectedTaskIds: TaskId[],
  activeCell: { taskId: TaskId | null; field: EditableField | null },
  rowAction: (ids: TaskId[]) => void,
  cellAction: (id: TaskId, field: EditableField) => void
): void {
  const verb = mode === "copy" ? "Copied" : "Cut";
  if (selectedTaskIds.length > 0) {
    rowAction(selectedTaskIds);
    toast.success(`${verb} ${selectedTaskIds.length} row(s)`);
    syncRowsToSystemClipboard();
  } else if (activeCell.taskId && activeCell.field) {
    cellAction(activeCell.taskId, activeCell.field);
    toast.success(`${verb} ${activeCell.field}`);
    syncCellToSystemClipboard();
  } else {
    toast(`Nothing to ${mode}`, { icon: "ℹ️" });
  }
}

/**
 * Try to paste rows from system clipboard.
 * Returns true if handled, false to continue to cell check or internal fallback.
 */
async function tryPasteRowsFromSystemClipboard(): Promise<boolean> {
  const { rowClipboard, pasteExternalRows, getClipboardMode } =
    useClipboardStore.getState();
  const internalMode = getClipboardMode();

  const externalRows = await readRowsFromSystemClipboard();
  if (!externalRows || externalRows.tasks.length === 0) return false;

  // Skip if this is the same data already in the internal clipboard.
  // Compare the full ID sequence — not just the first element — so a
  // different multi-task selection that happens to share the first ID
  // does not silently skip the external paste.
  const isSameAsInternal =
    internalMode === "row" &&
    hasSameTaskIds(rowClipboard.tasks, externalRows.tasks);

  if (isSameAsInternal) return false;

  const result = pasteExternalRows(externalRows);
  if (result.success) {
    toast.success(`Pasted ${externalRows.tasks.length} row(s) from clipboard`);
  } else if (result.error) {
    toast.error(result.error);
  }
  return true;
}

/**
 * Try to paste a cell from system clipboard.
 * Returns true if handled, false to continue to internal fallback.
 */
async function tryPasteCellFromSystemClipboard(): Promise<boolean> {
  const { cellClipboard, pasteExternalCell, getClipboardMode } =
    useClipboardStore.getState();
  const { activeCell } = useTaskStore.getState();
  const internalMode = getClipboardMode();

  const externalCell = await readCellFromSystemClipboard();
  if (!externalCell || !activeCell.taskId || !activeCell.field) return false;

  // Skip if this is the same data already in the internal clipboard.
  const isSameAsInternal =
    internalMode === "cell" &&
    cellClipboard.field === externalCell.field &&
    cellClipboard.value === externalCell.value;

  if (isSameAsInternal) return false;

  const result = pasteExternalCell(
    externalCell,
    activeCell.taskId,
    activeCell.field
  );
  if (result.success) {
    toast.success(`Pasted ${activeCell.field} from clipboard`);
  } else if (result.error) {
    toast.error(result.error);
  }
  return true;
}

/**
 * Try to paste from the system clipboard (cross-tab paste).
 * Returns true if the paste was handled, false to fall back to internal clipboard.
 *
 * Reads all required state via getState() so it works correctly across
 * async boundaries and never causes stale-closure issues.
 */
async function tryPasteFromSystemClipboard(): Promise<boolean> {
  if (!isClipboardApiAvailable()) return false;

  try {
    if (await tryPasteRowsFromSystemClipboard()) return true;
    if (await tryPasteCellFromSystemClipboard()) return true;
  } catch (err) {
    // System clipboard read failed — fall back to internal clipboard.
    if (import.meta.env.DEV) {
      console.warn(
        "System clipboard read failed, falling back to internal clipboard",
        err
      );
    }
  }

  return false;
}

/**
 * Paste from the internal clipboard (fallback when system clipboard is
 * unavailable or holds the same data as the internal clipboard).
 * Reads all state fresh via getState() to avoid stale-closure issues.
 */
async function pasteFromInternalClipboard(): Promise<void> {
  const { getClipboardMode, pasteRows, pasteCell } =
    useClipboardStore.getState();
  const { activeCell } = useTaskStore.getState();
  const internalMode = getClipboardMode();

  if (internalMode === "row") {
    const result = pasteRows();
    if (result.success) {
      toast.success("Pasted rows");
    } else if (result.error) {
      toast.error(result.error);
    }
  } else if (internalMode === "cell" && activeCell.taskId && activeCell.field) {
    const result = pasteCell(activeCell.taskId, activeCell.field);
    if (result.success) {
      toast.success(`Pasted ${activeCell.field}`);
    } else if (result.error) {
      toast.error(result.error);
    }
  } else {
    toast("Nothing to paste", { icon: "ℹ️" });
  }
}

// ---------------------------------------------------------------------------

export function useClipboardOperations(): ClipboardOperations {
  // Subscribe only to the actions needed — avoids re-renders on clipboard
  // data changes (those are read lazily via getState() in the helpers above).
  const copyRows = useClipboardStore((s) => s.copyRows);
  const cutRows = useClipboardStore((s) => s.cutRows);
  const copyCell = useClipboardStore((s) => s.copyCell);
  const cutCell = useClipboardStore((s) => s.cutCell);

  const selectedTaskIds = useTaskStore((s) => s.selectedTaskIds);
  const activeCell = useTaskStore((s) => s.activeCell);

  const canCopyOrCut =
    selectedTaskIds.length > 0 ||
    (activeCell.taskId !== null && activeCell.field !== null);

  // Subscribe directly to activeMode so canPaste is reactive without needing
  // separate rowClipboard/cellClipboard subscriptions.
  const canPaste = useClipboardStore((s) => s.activeMode !== null);

  const handleCopy = useCallback(() => {
    executeCopyOrCut("copy", selectedTaskIds, activeCell, copyRows, copyCell);
  }, [selectedTaskIds, activeCell, copyRows, copyCell]);

  const handleCut = useCallback(() => {
    executeCopyOrCut("cut", selectedTaskIds, activeCell, cutRows, cutCell);
  }, [selectedTaskIds, activeCell, cutRows, cutCell]);

  // Async paste: try system clipboard first, fall back to internal clipboard.
  // All state is read via getState() inside the helpers, so the dep array
  // stays empty and handlePaste is a stable function reference.
  const handlePaste = useCallback(async () => {
    const usedSystemClipboard = await tryPasteFromSystemClipboard();
    if (!usedSystemClipboard) {
      await pasteFromInternalClipboard();
    }
  }, []);

  return {
    handleCopy,
    handleCut,
    handlePaste,
    canCopyOrCut,
    canPaste,
  };
}
