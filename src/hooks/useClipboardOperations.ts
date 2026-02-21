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

export function useClipboardOperations(): ClipboardOperations {
  // Get only the specific actions/state we need to avoid unnecessary re-renders
  const copyRows = useClipboardStore((state) => state.copyRows);
  const cutRows = useClipboardStore((state) => state.cutRows);
  const pasteRows = useClipboardStore((state) => state.pasteRows);
  const copyCell = useClipboardStore((state) => state.copyCell);
  const cutCell = useClipboardStore((state) => state.cutCell);
  const pasteCell = useClipboardStore((state) => state.pasteCell);
  const pasteExternalRows = useClipboardStore(
    (state) => state.pasteExternalRows
  );
  const pasteExternalCell = useClipboardStore(
    (state) => state.pasteExternalCell
  );
  const getClipboardMode = useClipboardStore((state) => state.getClipboardMode);
  const rowClipboard = useClipboardStore((state) => state.rowClipboard);
  const cellClipboard = useClipboardStore((state) => state.cellClipboard);

  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const activeCell = useTaskStore((state) => state.activeCell);

  // Determine if copy/cut should be enabled
  const canCopyOrCut =
    selectedTaskIds.length > 0 ||
    (activeCell.taskId !== null && activeCell.field !== null);

  // Determine if paste should be enabled (internal clipboard only - external checked async)
  const canPaste = getClipboardMode() !== null;

  // Smart mode detection for copy
  const handleCopy = useCallback(() => {
    if (selectedTaskIds.length > 0) {
      // Row mode: Copy entire rows
      copyRows(selectedTaskIds);
      toast.success(`Copied ${selectedTaskIds.length} row(s)`);

      // Also write to system clipboard (fire-and-forget)
      if (isClipboardApiAvailable()) {
        const clipboardState = useClipboardStore.getState();
        writeRowsToSystemClipboard(
          clipboardState.rowClipboard.tasks,
          clipboardState.rowClipboard.dependencies
        ).catch(() => {
          // Silently fail - internal clipboard still works
        });
      }
    } else if (activeCell.taskId && activeCell.field) {
      // Cell mode: Copy single cell value
      copyCell(activeCell.taskId, activeCell.field);
      toast.success(`Copied ${activeCell.field}`);

      // Also write to system clipboard (fire-and-forget)
      if (isClipboardApiAvailable()) {
        const clipboardState = useClipboardStore.getState();
        if (
          clipboardState.cellClipboard.field &&
          clipboardState.cellClipboard.value != null
        ) {
          writeCellToSystemClipboard(
            clipboardState.cellClipboard.value,
            clipboardState.cellClipboard.field
          ).catch(() => {
            // Silently fail - internal clipboard still works
          });
        }
      }
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

      // Also write to system clipboard (fire-and-forget)
      // Note: Cut marks are internal only - cross-tab paste treats as copy
      if (isClipboardApiAvailable()) {
        const clipboardState = useClipboardStore.getState();
        writeRowsToSystemClipboard(
          clipboardState.rowClipboard.tasks,
          clipboardState.rowClipboard.dependencies
        ).catch(() => {
          // Silently fail - internal clipboard still works
        });
      }
    } else if (activeCell.taskId && activeCell.field) {
      // Cell mode: Cut single cell value
      cutCell(activeCell.taskId, activeCell.field);
      toast.success(`Cut ${activeCell.field}`);

      // Also write to system clipboard (fire-and-forget)
      if (isClipboardApiAvailable()) {
        const clipboardState = useClipboardStore.getState();
        if (
          clipboardState.cellClipboard.field &&
          clipboardState.cellClipboard.value != null
        ) {
          writeCellToSystemClipboard(
            clipboardState.cellClipboard.value,
            clipboardState.cellClipboard.field
          ).catch(() => {
            // Silently fail - internal clipboard still works
          });
        }
      }
    } else {
      toast("Nothing to cut", { icon: "ℹ️" });
    }
  }, [selectedTaskIds, activeCell, cutRows, cutCell]);

  // Smart mode detection for paste (async for system clipboard)
  const handlePaste = useCallback(async () => {
    const internalMode = getClipboardMode();

    // Try system clipboard first (for cross-tab paste)
    if (isClipboardApiAvailable()) {
      try {
        // Try reading rows from system clipboard
        const externalRows = await readRowsFromSystemClipboard();
        if (externalRows && externalRows.tasks.length > 0) {
          // Check if this is the same data as internal clipboard
          const isSameAsInternal =
            internalMode === "row" &&
            rowClipboard.tasks.length === externalRows.tasks.length &&
            rowClipboard.tasks[0]?.id === externalRows.tasks[0]?.id;

          if (!isSameAsInternal) {
            // External data differs from internal - use external (cross-tab paste)
            const result = pasteExternalRows(externalRows);
            if (result.success) {
              toast.success(
                `Pasted ${externalRows.tasks.length} row(s) from clipboard`
              );
            } else if (result.error) {
              toast.error(result.error);
            }
            return;
          }
        }

        // Try reading cell from system clipboard
        const externalCell = await readCellFromSystemClipboard();
        if (externalCell && activeCell.taskId && activeCell.field) {
          // Check if this is the same data as internal clipboard
          const isSameAsInternal =
            internalMode === "cell" &&
            cellClipboard.field === externalCell.field &&
            cellClipboard.value === externalCell.value;

          if (!isSameAsInternal) {
            // External data differs from internal - use external (cross-tab paste)
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
            return;
          }
        }
      } catch {
        // System clipboard read failed - fall back to internal clipboard
      }
    }

    // Fall back to internal clipboard
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
  }, [
    getClipboardMode,
    activeCell,
    pasteRows,
    pasteCell,
    pasteExternalRows,
    pasteExternalCell,
    rowClipboard.tasks,
    cellClipboard.field,
    cellClipboard.value,
  ]);

  return {
    handleCopy,
    handleCut,
    handlePaste,
    canCopyOrCut,
    canPaste,
  };
}
