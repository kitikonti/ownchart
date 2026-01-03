/**
 * Global keyboard shortcuts hook
 * Handles Ctrl+Z (undo), Ctrl+Shift+Z (redo), Ctrl+Y (redo alternative)
 * Handles Ctrl+S (save), Ctrl+Shift+S (save as), Ctrl+O (open), Ctrl+N (new)
 */

import { useEffect } from "react";
import { useHistoryStore } from "../store/slices/historySlice";
import { useFileOperations } from "./useFileOperations";

export function useKeyboardShortcuts() {
  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);
  const { handleSave, handleSaveAs, handleOpen, handleNew } =
    useFileOperations();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Ignore if typing in input/textarea or contentEditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
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
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [undo, redo, handleSave, handleSaveAs, handleOpen, handleNew]);
}
