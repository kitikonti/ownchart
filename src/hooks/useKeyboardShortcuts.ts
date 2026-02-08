/**
 * Global keyboard shortcuts hook
 * Handles Ctrl+Z (undo), Ctrl+Shift+Z (redo), Ctrl+Y (redo alternative)
 * Handles Ctrl+S (save), Ctrl+Shift+S (save as), Ctrl+O (open), Ctrl+N (new)
 * Handles Ctrl+C (copy), Ctrl+X (cut), Ctrl+V (paste)
 * Handles Ctrl+E (export to PNG)
 * Handles ESC (clear clipboard, close dialogs)
 * Handles ? (open help panel)
 * Handles D (toggle dependencies), T (toggle today marker)
 * Handles P (toggle progress column), H (toggle holidays)
 * Handles F (fit to view)
 */

import { useEffect } from "react";
import { useHistoryStore } from "../store/slices/historySlice";
import { useTaskStore } from "../store/slices/taskSlice";
import { useChartStore } from "../store/slices/chartSlice";
import { useUIStore } from "../store/slices/uiSlice";
import { useFileOperations } from "./useFileOperations";
import { useClipboardOperations } from "./useClipboardOperations";
import { useClipboardStore } from "../store/slices/clipboardSlice";

export function useKeyboardShortcuts(): void {
  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);
  const { handleSave, handleSaveAs, handleOpen, handleNew } =
    useFileOperations();
  const { handleCopy, handleCut, handlePaste } = useClipboardOperations();
  const clearClipboard = useClipboardStore((state) => state.clearClipboard);
  const clipboardMode = useClipboardStore((state) => state.activeMode);
  const deleteSelectedTasks = useTaskStore(
    (state) => state.deleteSelectedTasks
  );
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const activeCell = useTaskStore((state) => state.activeCell);
  const isEditingCell = useTaskStore((state) => state.isEditingCell);
  const insertTaskAbove = useTaskStore((state) => state.insertTaskAbove);
  const insertMultipleTasksAbove = useTaskStore(
    (state) => state.insertMultipleTasksAbove
  );
  const indentSelectedTasks = useTaskStore(
    (state) => state.indentSelectedTasks
  );
  const outdentSelectedTasks = useTaskStore(
    (state) => state.outdentSelectedTasks
  );

  // View toggle shortcuts (Sprint 1.5.9)
  const toggleDependencies = useChartStore((state) => state.toggleDependencies);
  const toggleTodayMarker = useChartStore((state) => state.toggleTodayMarker);
  const toggleProgress = useChartStore((state) => state.toggleProgress);
  const toggleHolidays = useChartStore((state) => state.toggleHolidays);
  const fitToView = useChartStore((state) => state.fitToView);
  const tasks = useTaskStore((state) => state.tasks);

  // UI state for dialogs
  const openExportDialog = useUIStore((state) => state.openExportDialog);
  const openHelpPanel = useUIStore((state) => state.openHelpPanel);
  const closeExportDialog = useUIStore((state) => state.closeExportDialog);
  const closeHelpPanel = useUIStore((state) => state.closeHelpPanel);
  const closeWelcomeTour = useUIStore((state) => state.dismissWelcome);
  const isExportDialogOpen = useUIStore((state) => state.isExportDialogOpen);
  const isHelpPanelOpen = useUIStore((state) => state.isHelpPanelOpen);
  const isWelcomeTourOpen = useUIStore((state) => state.isWelcomeTourOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Check if we're in a text input context
      const target = e.target as HTMLElement;
      const isTextInput =
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        (target.tagName === "INPUT" &&
          (target as HTMLInputElement).type !== "checkbox");
      // When a table cell is active, single-key shortcuts must be
      // suppressed so the keypress can start cell editing instead.
      const isCellActive = activeCell.taskId !== null;

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

      // Export: Ctrl+E or Cmd+E
      if (modKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        openExportDialog();
        return;
      }

      // ESC: Close dialogs first, then clear clipboard
      if (e.key === "Escape") {
        // Close dialogs in priority order
        if (isExportDialogOpen) {
          e.preventDefault();
          closeExportDialog();
          return;
        }
        if (isHelpPanelOpen) {
          e.preventDefault();
          closeHelpPanel();
          return;
        }
        if (isWelcomeTourOpen) {
          e.preventDefault();
          closeWelcomeTour();
          return;
        }

        // Clear clipboard (like Excel)
        if (clipboardMode !== null) {
          // Don't preventDefault - let other handlers (like Cell edit cancel) also handle it
          clearClipboard();
          return;
        }
        return;
      }

      // Delete: Delete selected tasks
      if (e.key === "Delete" && selectedTaskIds.length > 0) {
        e.preventDefault();
        deleteSelectedTasks();
        return;
      }

      // Ctrl+-: Delete selected tasks (Excel-style)
      // Always preventDefault to block browser zoom
      if (modKey && (e.key === "-" || e.key === "_") && !isEditingCell) {
        e.preventDefault();
        if (selectedTaskIds.length > 0) {
          deleteSelectedTasks();
        } else if (activeCell.taskId) {
          deleteTask(activeCell.taskId, true);
        }
        return;
      }

      // Ctrl++: Insert row(s) above (Excel-style)
      if (modKey && (e.key === "+" || e.key === "=") && !isEditingCell) {
        e.preventDefault();
        const count = Math.max(selectedTaskIds.length, 1);
        // Find topmost selected task (lowest index in tasks array)
        const currentTasks = useTaskStore.getState().tasks;
        let referenceTaskId: string | null = null;
        if (selectedTaskIds.length > 0) {
          const selectedSet = new Set(selectedTaskIds);
          for (const task of currentTasks) {
            if (selectedSet.has(task.id)) {
              referenceTaskId = task.id;
              break;
            }
          }
        }
        // Fallback to activeCell task
        if (!referenceTaskId && activeCell.taskId) {
          referenceTaskId = activeCell.taskId;
        }
        if (referenceTaskId) {
          if (count === 1) {
            insertTaskAbove(referenceTaskId);
          } else {
            insertMultipleTasksAbove(referenceTaskId, count);
          }
        }
        return;
      }

      // Alt+Shift+Right: Indent (MS Project style)
      if (e.altKey && e.shiftKey && e.key === "ArrowRight" && !isEditingCell) {
        e.preventDefault();
        indentSelectedTasks();
        return;
      }

      // Alt+Shift+Left: Outdent (MS Project style)
      if (e.altKey && e.shiftKey && e.key === "ArrowLeft" && !isEditingCell) {
        e.preventDefault();
        outdentSelectedTasks();
        return;
      }

      // ? key: Open help panel (when not in text input)
      if (e.key === "?" && !isTextInput && !isCellActive) {
        e.preventDefault();
        openHelpPanel();
        return;
      }

      // View toggle shortcuts (Sprint 1.5.9)
      // Only when not in text input/gridcell and no modifier keys
      if (
        !isTextInput &&
        !isCellActive &&
        !modKey &&
        !e.altKey &&
        !e.shiftKey
      ) {
        // D: Toggle dependencies
        if (e.key.toLowerCase() === "d") {
          e.preventDefault();
          toggleDependencies();
          return;
        }

        // T: Toggle today marker
        if (e.key.toLowerCase() === "t") {
          e.preventDefault();
          toggleTodayMarker();
          return;
        }

        // P: Toggle progress column
        if (e.key.toLowerCase() === "p") {
          e.preventDefault();
          toggleProgress();
          return;
        }

        // H: Toggle holidays
        if (e.key.toLowerCase() === "h") {
          e.preventDefault();
          toggleHolidays();
          return;
        }

        // F: Fit to view (fit timeline to show all tasks)
        if (e.key.toLowerCase() === "f") {
          e.preventDefault();
          fitToView(tasks);
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return (): void => {
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
    clearClipboard,
    clipboardMode,
    deleteSelectedTasks,
    deleteTask,
    selectedTaskIds,
    isEditingCell,
    insertTaskAbove,
    insertMultipleTasksAbove,
    indentSelectedTasks,
    outdentSelectedTasks,
    openExportDialog,
    openHelpPanel,
    closeExportDialog,
    closeHelpPanel,
    closeWelcomeTour,
    isExportDialogOpen,
    isHelpPanelOpen,
    isWelcomeTourOpen,
    toggleDependencies,
    toggleTodayMarker,
    toggleProgress,
    toggleHolidays,
    fitToView,
    tasks,
    activeCell,
  ]);
}
