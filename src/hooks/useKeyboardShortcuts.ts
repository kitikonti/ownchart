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
 * Handles Ctrl+H (hide selected rows), Ctrl+Shift+H (show all hidden rows)
 */

import { useEffect } from "react";
import { useHistoryStore } from "../store/slices/historySlice";
import { useTaskStore } from "../store/slices/taskSlice";
import { useChartStore } from "../store/slices/chartSlice";
import { useUIStore } from "../store/slices/uiSlice";
import { useFileOperations } from "./useFileOperations";
import { useClipboardOperations } from "./useClipboardOperations";
import { useHideOperations } from "./useHideOperations";
import { useClipboardStore } from "../store/slices/clipboardSlice";
import { buildFlattenedTaskList } from "../utils/hierarchy";

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
  const groupSelectedTasks = useTaskStore((state) => state.groupSelectedTasks);

  // View toggle shortcuts (Sprint 1.5.9)
  const toggleDependencies = useChartStore((state) => state.toggleDependencies);
  const toggleTodayMarker = useChartStore((state) => state.toggleTodayMarker);
  const toggleProgress = useChartStore((state) => state.toggleProgress);
  const toggleHolidays = useChartStore((state) => state.toggleHolidays);
  const fitToView = useChartStore((state) => state.fitToView);
  const tasks = useTaskStore((state) => state.tasks);

  // Hide/Show rows
  const { hideRows, showAll } = useHideOperations();

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
    // ─── Sub-handlers (each returns true if the event was consumed) ───

    const handleUndoRedo = (e: KeyboardEvent, modKey: boolean): boolean => {
      if (!modKey) return false;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return true;
      }
      if (key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
        return true;
      }
      if (key === "y") {
        e.preventDefault();
        redo();
        return true;
      }
      return false;
    };

    const handleFileShortcuts = (
      e: KeyboardEvent,
      modKey: boolean
    ): boolean => {
      if (!modKey) return false;
      const key = e.key.toLowerCase();
      if (key === "s" && !e.shiftKey) {
        e.preventDefault();
        handleSave();
        return true;
      }
      if (key === "s" && e.shiftKey) {
        e.preventDefault();
        handleSaveAs();
        return true;
      }
      if (key === "o") {
        e.preventDefault();
        handleOpen();
        return true;
      }
      if (key === "n" && e.altKey) {
        e.preventDefault();
        handleNew();
        return true;
      }
      if (key === "e") {
        e.preventDefault();
        openExportDialog();
        return true;
      }
      return false;
    };

    const handleClipboardShortcuts = (
      e: KeyboardEvent,
      modKey: boolean
    ): boolean => {
      if (!modKey) return false;
      const key = e.key.toLowerCase();
      if (key === "c") {
        e.preventDefault();
        handleCopy();
        return true;
      }
      if (key === "x") {
        e.preventDefault();
        handleCut();
        return true;
      }
      if (key === "v") {
        e.preventDefault();
        handlePaste();
        return true;
      }
      return false;
    };

    const handleEscapeKey = (e: KeyboardEvent): boolean => {
      if (e.key !== "Escape") return false;
      // Close dialogs in priority order
      if (isExportDialogOpen) {
        e.preventDefault();
        closeExportDialog();
        return true;
      }
      if (isHelpPanelOpen) {
        e.preventDefault();
        closeHelpPanel();
        return true;
      }
      if (isWelcomeTourOpen) {
        e.preventDefault();
        closeWelcomeTour();
        return true;
      }
      // Clear clipboard (like Excel)
      if (clipboardMode !== null) {
        clearClipboard();
        return true;
      }
      return false;
    };

    const handleStructureShortcuts = (
      e: KeyboardEvent,
      modKey: boolean
    ): boolean => {
      // Delete: Delete selected tasks
      if (e.key === "Delete" && selectedTaskIds.length > 0) {
        e.preventDefault();
        deleteSelectedTasks();
        return true;
      }
      // Ctrl+-: Delete selected tasks (Excel-style)
      if (modKey && (e.key === "-" || e.key === "_") && !isEditingCell) {
        e.preventDefault();
        if (selectedTaskIds.length > 0) {
          deleteSelectedTasks();
        } else if (activeCell.taskId) {
          deleteTask(activeCell.taskId, true);
        }
        return true;
      }
      // Ctrl++: Insert row(s) above (Excel-style)
      if (modKey && (e.key === "+" || e.key === "=") && !isEditingCell) {
        e.preventDefault();
        const count = Math.max(selectedTaskIds.length, 1);
        const currentTasks = useTaskStore.getState().tasks;
        const collapsedIds = new Set(
          currentTasks.filter((t) => t.open === false).map((t) => t.id)
        );
        const flatList = buildFlattenedTaskList(currentTasks, collapsedIds);
        let referenceTaskId: string | null = null;
        if (selectedTaskIds.length > 0) {
          const selectedSet = new Set(selectedTaskIds);
          for (const ft of flatList) {
            if (selectedSet.has(ft.task.id)) {
              referenceTaskId = ft.task.id;
              break;
            }
          }
        }
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
        return true;
      }
      // Alt+Shift+Right: Indent (MS Project style)
      if (e.altKey && e.shiftKey && e.key === "ArrowRight" && !isEditingCell) {
        e.preventDefault();
        indentSelectedTasks();
        return true;
      }
      // Alt+Shift+Left: Outdent (MS Project style)
      if (e.altKey && e.shiftKey && e.key === "ArrowLeft" && !isEditingCell) {
        e.preventDefault();
        outdentSelectedTasks();
        return true;
      }
      // Ctrl+G: Group selected tasks
      if (modKey && e.key.toLowerCase() === "g" && !isEditingCell) {
        e.preventDefault();
        groupSelectedTasks();
        return true;
      }
      // Ctrl+Shift+H: Show all hidden rows
      if (modKey && e.shiftKey && e.key.toLowerCase() === "h") {
        e.preventDefault();
        showAll();
        return true;
      }
      // Ctrl+H: Hide selected rows
      if (modKey && e.key.toLowerCase() === "h" && !e.shiftKey) {
        e.preventDefault();
        if (selectedTaskIds.length > 0) {
          hideRows(selectedTaskIds);
        }
        return true;
      }
      return false;
    };

    const handleViewToggles = (
      e: KeyboardEvent,
      isCellActive: boolean,
      isTextInput: boolean,
      modKey: boolean
    ): boolean => {
      if (isTextInput || isCellActive || modKey || e.altKey || e.shiftKey)
        return false;

      // ? key: Open help panel
      if (e.key === "?") {
        e.preventDefault();
        openHelpPanel();
        return true;
      }
      const key = e.key.toLowerCase();
      if (key === "d") {
        e.preventDefault();
        toggleDependencies();
        return true;
      }
      if (key === "t") {
        e.preventDefault();
        toggleTodayMarker();
        return true;
      }
      if (key === "p") {
        e.preventDefault();
        toggleProgress();
        return true;
      }
      if (key === "h") {
        e.preventDefault();
        toggleHolidays();
        return true;
      }
      if (key === "f") {
        e.preventDefault();
        fitToView(tasks);
        return true;
      }
      return false;
    };

    // ─── Main dispatcher ───

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
      const isCellActive = activeCell.taskId !== null;

      // For clipboard operations, allow even when checkbox is focused
      const isClipboardShortcut =
        modKey &&
        (e.key.toLowerCase() === "c" ||
          e.key.toLowerCase() === "x" ||
          e.key.toLowerCase() === "v");

      // Ignore non-clipboard shortcuts if typing in text input
      if (isTextInput && !isClipboardShortcut) return;
      // For clipboard shortcuts in text inputs (not checkbox), use native behavior
      if (isTextInput && isClipboardShortcut) return;

      if (handleUndoRedo(e, modKey)) return;
      if (handleFileShortcuts(e, modKey)) return;
      if (handleClipboardShortcuts(e, modKey)) return;
      if (handleEscapeKey(e)) return;
      if (handleStructureShortcuts(e, modKey)) return;
      if (handleViewToggles(e, isCellActive, isTextInput, modKey)) return;
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
    groupSelectedTasks,
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
    hideRows,
    showAll,
  ]);
}
