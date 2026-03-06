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
import {
  writeRowsToSystemClipboard,
  writeCellToSystemClipboard,
  readRowsFromSystemClipboard,
  readCellFromSystemClipboard,
  isClipboardApiAvailable,
} from "../utils/clipboard";

interface ClipboardOperations {
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
 * Fire-and-forget: write the current row clipboard to the system clipboard.
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
 * Fire-and-forget: write the current cell clipboard to the system clipboard.
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

  // Skip if this is the same data already in the internal clipboard
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
    // System clipboard read failed — fall back to internal clipboard
    if (import.meta.env.DEV) {
      console.warn(
        "System clipboard read failed, falling back to internal clipboard",
        err
      );
    }
  }

  return false;
}

// ---------------------------------------------------------------------------

export function useClipboardOperations(): ClipboardOperations {
  // Get only the specific actions we need to avoid unnecessary re-renders
  const copyRows = useClipboardStore((state) => state.copyRows);
  const cutRows = useClipboardStore((state) => state.cutRows);
  const copyCell = useClipboardStore((state) => state.copyCell);
  const cutCell = useClipboardStore((state) => state.cutCell);

  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const activeCell = useTaskStore((state) => state.activeCell);

  // Determine if copy/cut should be enabled
  const canCopyOrCut =
    selectedTaskIds.length > 0 ||
    (activeCell.taskId !== null && activeCell.field !== null);

  // Subscribe directly to activeMode so canPaste is reactive without needing
  // separate rowClipboard/cellClipboard subscriptions or void suppressions.
  const canPaste = useClipboardStore((state) => state.activeMode !== null);

  // Smart mode detection for copy
  const handleCopy = useCallback(() => {
    if (selectedTaskIds.length > 0) {
      // Row mode: Copy entire rows
      copyRows(selectedTaskIds);
      toast.success(`Copied ${selectedTaskIds.length} row(s)`);
      // Write to system clipboard after store is updated (fire-and-forget)
      syncRowsToSystemClipboard();
    } else if (activeCell.taskId && activeCell.field) {
      // Cell mode: Copy single cell value
      copyCell(activeCell.taskId, activeCell.field);
      toast.success(`Copied ${activeCell.field}`);
      // Write to system clipboard after store is updated (fire-and-forget)
      syncCellToSystemClipboard();
    } else {
      toast("Nothing to copy", { icon: "ℹ️" });
    }
  }, [selectedTaskIds, activeCell, copyRows, copyCell]);

  // Smart mode detection for cut
  const handleCut = useCallback(() => {
    if (selectedTaskIds.length > 0) {
      // Row mode: Cut entire rows
      cutRows(selectedTaskIds);
      toast.success(`Cut ${selectedTaskIds.length} row(s)`);
      // Note: Cut marks are internal only — cross-tab paste treats as copy
      syncRowsToSystemClipboard();
    } else if (activeCell.taskId && activeCell.field) {
      // Cell mode: Cut single cell value
      cutCell(activeCell.taskId, activeCell.field);
      toast.success(`Cut ${activeCell.field}`);
      syncCellToSystemClipboard();
    } else {
      toast("Nothing to cut", { icon: "ℹ️" });
    }
  }, [selectedTaskIds, activeCell, cutRows, cutCell]);

  // Smart mode detection for paste (async for system clipboard).
  // Reads all state via getState() inside helpers so the dep array stays
  // minimal and handlePaste remains a stable function reference.
  const handlePaste = useCallback(async () => {
    const usedSystemClipboard = await tryPasteFromSystemClipboard();
    if (usedSystemClipboard) return;

    // Fall back to internal clipboard — read fresh state after the async gap
    const { getClipboardMode, pasteRows, pasteCell } =
      useClipboardStore.getState();
    const { activeCell } = useTaskStore.getState();
    const internalMode = getClipboardMode();

    if (internalMode === "row") {
      // Paste rows
      const result = pasteRows();
      if (result.success) {
        toast.success("Pasted rows");
      } else if (result.error) {
        toast.error(result.error);
      }
    } else if (
      internalMode === "cell" &&
      activeCell.taskId &&
      activeCell.field
    ) {
      // Paste cell value
      const result = pasteCell(activeCell.taskId, activeCell.field);
      if (result.success) {
        toast.success(`Pasted ${activeCell.field}`);
      } else if (result.error) {
        toast.error(result.error);
      }
    } else {
      toast("Nothing to paste", { icon: "ℹ️" });
    }
  }, []); // stable — all state accessed via getState() inside helpers

  return {
    handleCopy,
    handleCut,
    handlePaste,
    canCopyOrCut,
    canPaste,
  };
}
