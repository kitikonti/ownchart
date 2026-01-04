/**
 * Custom hook for clipboard operations (copy/cut/paste).
 * Centralizes clipboard logic used by both keyboard shortcuts and toolbar buttons.
 * Supports both row-level and cell-level operations with smart mode detection.
 */

import { useCallback } from "react";
import toast from "react-hot-toast";
import { useClipboardStore } from "../store/slices/clipboardSlice";
import { useTaskStore } from "../store/slices/taskSlice";

interface ClipboardOperations {
  handleCopy: () => void;
  handleCut: () => void;
  handlePaste: () => void;
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
  const getClipboardMode = useClipboardStore((state) => state.getClipboardMode);

  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const activeCell = useTaskStore((state) => state.activeCell);

  // Determine if copy/cut should be enabled
  const canCopyOrCut =
    selectedTaskIds.length > 0 ||
    (activeCell.taskId !== null && activeCell.field !== null);

  // Determine if paste should be enabled
  const canPaste = getClipboardMode() !== null;

  // Smart mode detection for copy
  const handleCopy = useCallback(() => {
    if (selectedTaskIds.length > 0) {
      // Row mode: Copy entire rows
      copyRows(selectedTaskIds);
      toast.success(`Copied ${selectedTaskIds.length} row(s)`);
    } else if (activeCell.taskId && activeCell.field) {
      // Cell mode: Copy single cell value
      copyCell(activeCell.taskId, activeCell.field);
      toast.success(`Copied ${activeCell.field}`);
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
    } else if (activeCell.taskId && activeCell.field) {
      // Cell mode: Cut single cell value
      cutCell(activeCell.taskId, activeCell.field);
      toast.success(`Cut ${activeCell.field}`);
    } else {
      toast("Nothing to cut", { icon: "ℹ️" });
    }
  }, [selectedTaskIds, activeCell, cutRows, cutCell]);

  // Smart mode detection for paste
  const handlePaste = useCallback(() => {
    const mode = getClipboardMode();

    if (mode === "row") {
      // Paste rows
      const result = pasteRows();
      if (result.success) {
        toast.success("Pasted rows");
      } else if (result.error) {
        toast.error(result.error);
      }
    } else if (mode === "cell" && activeCell.taskId && activeCell.field) {
      // Paste cell value
      const result = pasteCell(activeCell.taskId, activeCell.field);
      if (result.success) {
        toast.success(`Pasted ${activeCell.field}`);
      }
      // Errors are already shown by pasteCell
    } else {
      toast("Nothing to paste", { icon: "ℹ️" });
    }
  }, [getClipboardMode, activeCell, pasteRows, pasteCell]);

  return {
    handleCopy,
    handleCut,
    handlePaste,
    canCopyOrCut,
    canPaste,
  };
}
