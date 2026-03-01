/**
 * Global keyboard shortcuts hook
 * Handles Ctrl+Z (undo), Ctrl+Shift+Z (redo), Ctrl+Y (redo alternative)
 * Handles Ctrl+S (save), Ctrl+Shift+S (save as), Ctrl+O (open), Ctrl+Alt+N (new)
 * Handles Ctrl+C (copy), Ctrl+X (cut), Ctrl+V (paste)
 * Handles Ctrl+E (export to PNG)
 * Handles ESC (close dialogs in priority order, then clear clipboard)
 * Handles ? (open help panel) — checked before shiftKey guard for US-keyboard compat
 * Handles D (toggle dependencies), T (toggle today marker)
 * Handles P (toggle progress column), H (toggle holidays)
 * Handles F (fit to view)
 * Handles Ctrl+H (hide selected rows), Ctrl+Shift+H (unhide hidden rows in selection)
 * Handles Ctrl+G (group), Ctrl+Shift+G (ungroup)
 */

import { useEffect, useMemo, useRef } from "react";
import { useHistoryStore } from "../store/slices/historySlice";
import { useTaskStore } from "../store/slices/taskSlice";
import { useChartStore } from "../store/slices/chartSlice";
import { useUIStore } from "../store/slices/uiSlice";
import { useFileOperations } from "./useFileOperations";
import { useClipboardOperations } from "./useClipboardOperations";
import { useHideOperations } from "./useHideOperations";
import { useClipboardStore } from "../store/slices/clipboardSlice";
import { buildFlattenedTaskList } from "../utils/hierarchy";
import type { TaskId } from "../types/branded.types";

export function useKeyboardShortcuts(): void {
  // ── History ────────────────────────────────────────────────────────────
  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);

  // ── File operations ────────────────────────────────────────────────────
  const { handleSave, handleSaveAs, handleOpen, handleNew } =
    useFileOperations();

  // ── Clipboard ──────────────────────────────────────────────────────────
  const { handleCopy, handleCut, handlePaste } = useClipboardOperations();
  const clearClipboard = useClipboardStore((state) => state.clearClipboard);
  const clipboardMode = useClipboardStore((state) => state.activeMode);

  // ── Task operations ────────────────────────────────────────────────────
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
  const ungroupSelectedTasks = useTaskStore(
    (state) => state.ungroupSelectedTasks
  );

  // ── View toggles ───────────────────────────────────────────────────────
  const toggleDependencies = useChartStore((state) => state.toggleDependencies);
  const toggleTodayMarker = useChartStore((state) => state.toggleTodayMarker);
  const toggleProgress = useChartStore((state) => state.toggleProgress);
  const toggleHolidays = useChartStore((state) => state.toggleHolidays);
  const fitToView = useChartStore((state) => state.fitToView);

  // ── Hide / Show rows ───────────────────────────────────────────────────
  const { hideRows, unhideSelection } = useHideOperations();

  // ── UI / dialogs ───────────────────────────────────────────────────────
  const openExportDialog = useUIStore((state) => state.openExportDialog);
  const openHelpPanel = useUIStore((state) => state.openHelpPanel);
  const closeExportDialog = useUIStore((state) => state.closeExportDialog);
  const closeHelpPanel = useUIStore((state) => state.closeHelpPanel);
  const closeWelcomeTour = useUIStore((state) => state.dismissWelcome);
  const isExportDialogOpen = useUIStore((state) => state.isExportDialogOpen);
  const isHelpPanelOpen = useUIStore((state) => state.isHelpPanelOpen);
  const isWelcomeTourOpen = useUIStore((state) => state.isWelcomeTourOpen);

  // Detect modifier-key convention for this OS once per mount.
  // navigator.userAgentData.platform is the modern standard (Chromium 90+);
  // navigator.platform is deprecated but remains the universal fallback.
  const isMac = useMemo(
    () =>
      (navigator as Navigator & { userAgentData?: { platform?: string } })
        .userAgentData?.platform === "macOS" ||
      navigator.platform.toUpperCase().includes("MAC"),
    [],
  );

  // ── Stable handler ref ─────────────────────────────────────────────────
  // The event listener is registered once (empty dep array below).
  // On every render, handlerRef.current is replaced with a fresh closure so
  // all sub-handlers always see the latest Zustand-subscribed values.
  // This prevents the listener from being torn down and re-added on every
  // task edit, selection change, or cell navigation.
  const handlerRef = useRef<(e: KeyboardEvent) => void>(() => {});

  // ── Sub-handlers (each returns true when the event is consumed) ────────

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

  const handleFileShortcuts = (e: KeyboardEvent, modKey: boolean): boolean => {
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

  const handleDeleteShortcuts = (
    e: KeyboardEvent,
    modKey: boolean
  ): boolean => {
    // Delete key: remove selected tasks
    if (e.key === "Delete" && selectedTaskIds.length > 0) {
      e.preventDefault();
      deleteSelectedTasks();
      return true;
    }
    // Ctrl+-: delete selected tasks or the active-cell task (Excel-style)
    if (modKey && (e.key === "-" || e.key === "_") && !isEditingCell) {
      e.preventDefault();
      if (selectedTaskIds.length > 0) {
        deleteSelectedTasks();
      } else if (activeCell.taskId) {
        deleteTask(activeCell.taskId, true);
      }
      return true;
    }
    return false;
  };

  const handleInsertShortcuts = (
    e: KeyboardEvent,
    modKey: boolean
  ): boolean => {
    // Ctrl++: insert row(s) above selection (Excel-style)
    if (!modKey || !(e.key === "+" || e.key === "=") || isEditingCell) {
      return false;
    }
    e.preventDefault();
    const count = Math.max(selectedTaskIds.length, 1);
    // Fetch tasks fresh so this handler doesn't need `tasks` in any dep array.
    const currentTasks = useTaskStore.getState().tasks;
    const collapsedIds = new Set(
      currentTasks.filter((t) => t.open === false).map((t) => t.id)
    );
    const flatList = buildFlattenedTaskList(currentTasks, collapsedIds);
    let referenceTaskId: TaskId | null = null;
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
  };

  const handleIndentShortcuts = (e: KeyboardEvent): boolean => {
    // Alt+Shift+Arrow: indent / outdent (MS Project style)
    if (!e.altKey || !e.shiftKey || isEditingCell) return false;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      indentSelectedTasks();
      return true;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      outdentSelectedTasks();
      return true;
    }
    return false;
  };

  const handleGroupShortcuts = (e: KeyboardEvent, modKey: boolean): boolean => {
    if (!modKey || isEditingCell) return false;
    // Check Shift+G before plain G so Ctrl+Shift+G never falls through to Ctrl+G.
    if (e.shiftKey && e.key.toLowerCase() === "g") {
      e.preventDefault();
      ungroupSelectedTasks();
      return true;
    }
    if (!e.shiftKey && e.key.toLowerCase() === "g") {
      e.preventDefault();
      groupSelectedTasks();
      return true;
    }
    return false;
  };

  const handleHideShortcuts = (e: KeyboardEvent, modKey: boolean): boolean => {
    if (!modKey || e.key.toLowerCase() !== "h") return false;
    e.preventDefault();
    if (e.shiftKey) {
      // Ctrl+Shift+H: unhide hidden rows spanned by the current selection
      unhideSelection(selectedTaskIds);
    } else if (selectedTaskIds.length > 0) {
      // Ctrl+H: hide selected rows
      hideRows(selectedTaskIds);
    }
    return true;
  };

  const handleSingleKeyShortcuts = (
    e: KeyboardEvent,
    isCellActive: boolean,
    modKey: boolean
  ): boolean => {
    // The ? key is handled before the shiftKey guard because on US keyboards
    // it is produced by Shift+/, which would otherwise be blocked below.
    if (e.key === "?" && !isCellActive && !modKey && !e.altKey) {
      e.preventDefault();
      openHelpPanel();
      return true;
    }
    if (isCellActive || modKey || e.altKey || e.shiftKey) return false;

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
      // Fetch tasks fresh so the hook does not subscribe to `tasks` and
      // re-register the listener on every task mutation.
      fitToView(useTaskStore.getState().tasks);
      return true;
    }
    return false;
  };

  // ── Main dispatcher ────────────────────────────────────────────────────
  handlerRef.current = (e: KeyboardEvent): void => {
    const modKey = isMac ? e.metaKey : e.ctrlKey;

    const target = e.target as HTMLElement | null;
    if (!target) return;

    const isTextInput =
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable ||
      (target.tagName === "INPUT" &&
        (target as HTMLInputElement).type !== "checkbox");

    // Ignore all shortcuts when the user is typing in a text field.
    // Checkbox-focused elements are intentionally excluded so that
    // clipboard and other operations continue to work normally.
    if (isTextInput) return;

    const isCellActive = activeCell.taskId !== null;

    if (handleUndoRedo(e, modKey)) return;
    if (handleFileShortcuts(e, modKey)) return;
    if (handleClipboardShortcuts(e, modKey)) return;
    if (handleEscapeKey(e)) return;
    if (handleDeleteShortcuts(e, modKey)) return;
    if (handleInsertShortcuts(e, modKey)) return;
    if (handleIndentShortcuts(e)) return;
    if (handleGroupShortcuts(e, modKey)) return;
    if (handleHideShortcuts(e, modKey)) return;
    if (handleSingleKeyShortcuts(e, isCellActive, modKey)) return;
  };

  // Register the listener once; handlerRef.current always delegates to the
  // latest handler so no teardown/re-add cycle is needed on state changes.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => handlerRef.current(e);
    window.addEventListener("keydown", onKeyDown);
    return (): void => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
