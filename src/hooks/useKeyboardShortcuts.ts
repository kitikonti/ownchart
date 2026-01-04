/**
 * Global keyboard shortcuts hook
 * Handles Ctrl+Z (undo), Ctrl+Shift+Z (redo), Ctrl+Y (redo alternative)
 * Handles Ctrl+S (save), Ctrl+Shift+S (save as), Ctrl+O (open), Ctrl+N (new)
 * Handles Ctrl+C (copy), Ctrl+X (cut), Ctrl+V (paste)
 */

import { useEffect } from "react";
import { useHistoryStore } from "../store/slices/historySlice";
import { useFileOperations } from "./useFileOperations";
import { useClipboardOperations } from "./useClipboardOperations";

export function useKeyboardShortcuts() {
  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);
  const { handleSave, handleSaveAs, handleOpen, handleNew } =
    useFileOperations();
  const { handleCopy, handleCut, handlePaste } = useClipboardOperations();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Check if we're in a text input context
      const target = e.target as HTMLElement;
      const isTextInput =
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        (target.tagName === "INPUT" &&
          (target as HTMLInputElement).type !== "checkbox");

      // For clipboard operations, allow even when checkbox is focused
      const isClipboardShortcut =
        modKey &&
        (e.key.toLowerCase() === "c" ||
          e.key.toLowerCase() === "x" ||
          e.key.toLowerCase() === "v");

      // Ignore non-clipboard shortcuts if typing in text input
      if (isTextInput && !isClipboardShortcut) {
        return;
      }

      // For clipboard shortcuts in text inputs (not checkbox), use native behavior
      if (isTextInput && isClipboardShortcut) {
        return;
      }

      // Undo: Ctrl+Z or Cmd+Z (without Shift)
      if (modKey && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Shift+Z or Cmd+Shift+Z
      if (modKey && e.key.toLowerCase() === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
        return;
      }

      // Redo: Ctrl+Y or Cmd+Y (alternative)
      if (modKey && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }

      // Save: Ctrl+S or Cmd+S (without Shift)
      if (modKey && e.key.toLowerCase() === "s" && !e.shiftKey) {
        e.preventDefault();
        handleSave();
        return;
      }

      // Save As: Ctrl+Shift+S or Cmd+Shift+S
      if (modKey && e.key.toLowerCase() === "s" && e.shiftKey) {
        e.preventDefault();
        handleSaveAs();
        return;
      }

      // Open: Ctrl+O or Cmd+O
      if (modKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        handleOpen();
        return;
      }

      // New: Ctrl+Alt+N or Cmd+Alt+N (Ctrl+N is blocked by browser)
      if (modKey && e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleNew();
        return;
      }

      // Copy: Ctrl+C or Cmd+C
      if (modKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopy();
        return;
      }

      // Cut: Ctrl+X or Cmd+X
      if (modKey && e.key.toLowerCase() === "x") {
        e.preventDefault();
        handleCut();
        return;
      }

      // Paste: Ctrl+V or Cmd+V
      if (modKey && e.key.toLowerCase() === "v") {
        e.preventDefault();
        handlePaste();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    undo,
    redo,
    handleSave,
    handleSaveAs,
    handleOpen,
    handleNew,
    handleCopy,
    handleCut,
    handlePaste,
  ]);
}
