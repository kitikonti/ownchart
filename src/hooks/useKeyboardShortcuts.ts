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

import { useEffect, useRef } from "react";
import type { Task } from "../types/chart.types";
import type { TaskId } from "../types/branded.types";
import type { EditableField } from "../types/task.types";
import { useHistoryStore } from "../store/slices/historySlice";
import { useTaskStore } from "../store/slices/taskSlice";
import { useChartStore } from "../store/slices/chartSlice";
import { useUIStore } from "../store/slices/uiSlice";
import { useClipboardStore } from "../store/slices/clipboardSlice";
import { useFileOperations } from "./useFileOperations";
import { useClipboardOperations } from "./useClipboardOperations";
import { useHideOperations } from "./useHideOperations";
import { findTopmostSelectedTaskId } from "../utils/selection";

// ── Context ───────────────────────────────────────────────────────────────────
// A single snapshot of all state needed by the sub-handlers.  Built fresh on
// every render inside handlerRef.current and passed into every module-level
// handler so they remain pure, testable functions with no closed-over stale
// values.

interface ActiveCell {
  taskId: TaskId | null;
  field: EditableField | null;
}

interface ShortcutContext {
  // History
  undo: () => void;
  redo: () => void;
  // File ops
  handleSave: () => void;
  handleSaveAs: () => void;
  handleOpen: () => void;
  handleNew: () => void;
  openExportDialog: () => void;
  // Clipboard
  handleCopy: () => void;
  handleCut: () => void;
  handlePaste: () => void;
  clearClipboard: () => void;
  clipboardMode: "row" | "cell" | null;
  // Task state
  isEditingCell: boolean;
  selectedTaskIds: TaskId[];
  activeCell: ActiveCell;
  deleteSelectedTasks: () => void;
  deleteTask: (id: TaskId, cascade?: boolean) => void;
  insertTaskAbove: (referenceTaskId: TaskId) => void;
  insertMultipleTasksAbove: (referenceTaskId: TaskId, count: number) => void;
  indentSelectedTasks: () => void;
  outdentSelectedTasks: () => void;
  groupSelectedTasks: () => void;
  ungroupSelectedTasks: () => void;
  // View
  toggleDependencies: () => void;
  toggleTodayMarker: () => void;
  toggleProgress: () => void;
  toggleHolidays: () => void;
  fitToView: (tasks: Task[]) => void;
  // Hide
  hideRows: (ids: TaskId[]) => void;
  unhideSelection: (ids: TaskId[]) => void;
  // UI dialogs
  openHelpPanel: () => void;
  closeExportDialog: () => void;
  closeHelpPanel: () => void;
  closeWelcomeTour: () => void;
  isExportDialogOpen: boolean;
  isHelpPanelOpen: boolean;
  isWelcomeTourOpen: boolean;
}

// ── Sub-handlers (module-level; return true when the event is consumed) ───────

function handleUndoRedo(
  e: KeyboardEvent,
  modKey: boolean,
  ctx: ShortcutContext
): boolean {
  if (!modKey) return false;
  const key = e.key.toLowerCase();
  if (key === "z" && !e.shiftKey) {
    e.preventDefault();
    ctx.undo();
    return true;
  }
  if (key === "z" && e.shiftKey) {
    e.preventDefault();
    ctx.redo();
    return true;
  }
  if (key === "y") {
    e.preventDefault();
    ctx.redo();
    return true;
  }
  return false;
}

function handleFileShortcuts(
  e: KeyboardEvent,
  modKey: boolean,
  ctx: ShortcutContext
): boolean {
  if (!modKey) return false;
  const key = e.key.toLowerCase();
  if (key === "s" && !e.shiftKey) {
    e.preventDefault();
    ctx.handleSave();
    return true;
  }
  if (key === "s" && e.shiftKey) {
    e.preventDefault();
    ctx.handleSaveAs();
    return true;
  }
  if (key === "o") {
    e.preventDefault();
    ctx.handleOpen();
    return true;
  }
  if (key === "n" && e.altKey) {
    e.preventDefault();
    ctx.handleNew();
    return true;
  }
  if (key === "e") {
    e.preventDefault();
    ctx.openExportDialog();
    return true;
  }
  return false;
}

function handleClipboardShortcuts(
  e: KeyboardEvent,
  modKey: boolean,
  ctx: ShortcutContext
): boolean {
  if (!modKey) return false;
  const key = e.key.toLowerCase();
  if (key === "c") {
    e.preventDefault();
    ctx.handleCopy();
    return true;
  }
  if (key === "x") {
    e.preventDefault();
    ctx.handleCut();
    return true;
  }
  if (key === "v") {
    e.preventDefault();
    ctx.handlePaste();
    return true;
  }
  return false;
}

function handleEscapeKey(e: KeyboardEvent, ctx: ShortcutContext): boolean {
  if (e.key !== "Escape") return false;
  // Close dialogs in priority order
  if (ctx.isExportDialogOpen) {
    e.preventDefault();
    ctx.closeExportDialog();
    return true;
  }
  if (ctx.isHelpPanelOpen) {
    e.preventDefault();
    ctx.closeHelpPanel();
    return true;
  }
  if (ctx.isWelcomeTourOpen) {
    e.preventDefault();
    ctx.closeWelcomeTour();
    return true;
  }
  // Clear clipboard (like Excel)
  if (ctx.clipboardMode !== null) {
    ctx.clearClipboard();
    return true;
  }
  return false;
}

function handleDeleteShortcuts(
  e: KeyboardEvent,
  modKey: boolean,
  ctx: ShortcutContext
): boolean {
  // Delete key: remove selected tasks (guard isEditingCell for consistency
  // with handleInsertShortcuts / handleIndentShortcuts / handleGroupShortcuts)
  if (
    e.key === "Delete" &&
    !ctx.isEditingCell &&
    ctx.selectedTaskIds.length > 0
  ) {
    e.preventDefault();
    ctx.deleteSelectedTasks();
    return true;
  }
  // Ctrl+-: delete selected tasks or the active-cell task (Excel-style)
  if (modKey && (e.key === "-" || e.key === "_") && !ctx.isEditingCell) {
    e.preventDefault();
    if (ctx.selectedTaskIds.length > 0) {
      ctx.deleteSelectedTasks();
    } else if (ctx.activeCell.taskId) {
      ctx.deleteTask(ctx.activeCell.taskId, true);
    }
    return true;
  }
  return false;
}

function handleInsertShortcuts(
  e: KeyboardEvent,
  modKey: boolean,
  ctx: ShortcutContext
): boolean {
  // Ctrl++: insert row(s) above selection (Excel-style).
  // Positive guard: only proceed when all three conditions are met.
  if (modKey && (e.key === "+" || e.key === "=") && !ctx.isEditingCell) {
    e.preventDefault();
    const count = Math.max(ctx.selectedTaskIds.length, 1);
    // Fetch tasks fresh so this handler doesn't need `tasks` in any dep array.
    const currentTasks = useTaskStore.getState().tasks;
    const referenceTaskId =
      findTopmostSelectedTaskId(currentTasks, ctx.selectedTaskIds) ??
      ctx.activeCell.taskId;
    if (referenceTaskId) {
      if (count === 1) {
        ctx.insertTaskAbove(referenceTaskId);
      } else {
        ctx.insertMultipleTasksAbove(referenceTaskId, count);
      }
    }
    return true;
  }
  return false;
}

function handleIndentShortcuts(
  e: KeyboardEvent,
  ctx: ShortcutContext
): boolean {
  // Alt+Shift+Arrow: indent / outdent (MS Project style)
  if (!e.altKey || !e.shiftKey || ctx.isEditingCell) return false;
  if (e.key === "ArrowRight") {
    e.preventDefault();
    ctx.indentSelectedTasks();
    return true;
  }
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    ctx.outdentSelectedTasks();
    return true;
  }
  return false;
}

function handleGroupShortcuts(
  e: KeyboardEvent,
  modKey: boolean,
  ctx: ShortcutContext
): boolean {
  if (!modKey || ctx.isEditingCell) return false;
  // Check Shift+G before plain G so Ctrl+Shift+G never falls through to Ctrl+G.
  if (e.shiftKey && e.key.toLowerCase() === "g") {
    e.preventDefault();
    ctx.ungroupSelectedTasks();
    return true;
  }
  if (!e.shiftKey && e.key.toLowerCase() === "g") {
    e.preventDefault();
    ctx.groupSelectedTasks();
    return true;
  }
  return false;
}

function handleHideShortcuts(
  e: KeyboardEvent,
  modKey: boolean,
  ctx: ShortcutContext
): boolean {
  if (!modKey || e.key.toLowerCase() !== "h") return false;
  if (e.shiftKey) {
    // Ctrl+Shift+H: unhide hidden rows spanned by the current selection
    e.preventDefault();
    ctx.unhideSelection(ctx.selectedTaskIds);
    return true;
  }
  if (ctx.selectedTaskIds.length > 0) {
    // Ctrl+H: hide selected rows
    e.preventDefault();
    ctx.hideRows(ctx.selectedTaskIds);
    return true;
  }
  // Nothing to do — don't suppress the browser's Ctrl+H default.
  return false;
}

function handleSingleKeyShortcuts(
  e: KeyboardEvent,
  isCellActive: boolean,
  modKey: boolean,
  ctx: ShortcutContext
): boolean {
  // The ? key is handled before the shiftKey guard because on US keyboards
  // it is produced by Shift+/, which would otherwise be blocked below.
  if (e.key === "?" && !isCellActive && !modKey && !e.altKey) {
    e.preventDefault();
    ctx.openHelpPanel();
    return true;
  }
  if (isCellActive || modKey || e.altKey || e.shiftKey) return false;

  const key = e.key.toLowerCase();
  if (key === "d") {
    e.preventDefault();
    ctx.toggleDependencies();
    return true;
  }
  if (key === "t") {
    e.preventDefault();
    ctx.toggleTodayMarker();
    return true;
  }
  if (key === "p") {
    e.preventDefault();
    ctx.toggleProgress();
    return true;
  }
  if (key === "h") {
    e.preventDefault();
    ctx.toggleHolidays();
    return true;
  }
  if (key === "f") {
    e.preventDefault();
    // Fetch tasks fresh so the hook does not subscribe to `tasks` and
    // re-register the listener on every task mutation.
    ctx.fitToView(useTaskStore.getState().tasks);
    return true;
  }
  return false;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

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
  // useRef with lazy init is the precise semantic for "compute once, never
  // discard" — unlike useMemo, React will never throw away a ref's value.
  // navigator.userAgentData.platform is the modern standard (Chromium 90+);
  // navigator.platform is deprecated but remains the universal fallback.
  const isMacRef = useRef<boolean | null>(null);
  if (isMacRef.current === null) {
    isMacRef.current =
      (navigator as Navigator & { userAgentData?: { platform?: string } })
        .userAgentData?.platform === "macOS" ||
      navigator.platform.toUpperCase().includes("MAC");
  }
  const isMac = isMacRef.current;

  // ── Stable handler ref ─────────────────────────────────────────────────
  // The event listener is registered once (empty dep array below).
  // On every render, handlerRef.current is replaced with a fresh closure so
  // all sub-handlers always see the latest Zustand-subscribed values.
  // This prevents the listener from being torn down and re-added on every
  // task edit, selection change, or cell navigation.
  const handlerRef = useRef<(e: KeyboardEvent) => void>(() => {});

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

    // Build a context snapshot from the latest subscribed values so each
    // module-level sub-handler receives a single, consistent object.
    const ctx: ShortcutContext = {
      undo,
      redo,
      handleSave,
      handleSaveAs,
      handleOpen,
      handleNew,
      openExportDialog,
      handleCopy,
      handleCut,
      handlePaste,
      clearClipboard,
      clipboardMode,
      isEditingCell,
      selectedTaskIds,
      activeCell,
      deleteSelectedTasks,
      deleteTask,
      insertTaskAbove,
      insertMultipleTasksAbove,
      indentSelectedTasks,
      outdentSelectedTasks,
      groupSelectedTasks,
      ungroupSelectedTasks,
      toggleDependencies,
      toggleTodayMarker,
      toggleProgress,
      toggleHolidays,
      fitToView,
      hideRows,
      unhideSelection,
      openHelpPanel,
      closeExportDialog,
      closeHelpPanel,
      closeWelcomeTour,
      isExportDialogOpen,
      isHelpPanelOpen,
      isWelcomeTourOpen,
    };

    if (handleUndoRedo(e, modKey, ctx)) return;
    if (handleFileShortcuts(e, modKey, ctx)) return;
    if (handleClipboardShortcuts(e, modKey, ctx)) return;
    if (handleEscapeKey(e, ctx)) return;
    if (handleDeleteShortcuts(e, modKey, ctx)) return;
    if (handleInsertShortcuts(e, modKey, ctx)) return;
    if (handleIndentShortcuts(e, ctx)) return;
    if (handleGroupShortcuts(e, modKey, ctx)) return;
    if (handleHideShortcuts(e, modKey, ctx)) return;
    if (handleSingleKeyShortcuts(e, isCellActive, modKey, ctx)) return;
  };

  // Register the listener once; handlerRef.current always delegates to the
  // latest handler so no teardown/re-add cycle is needed on state changes.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => handlerRef.current(e);
    window.addEventListener("keydown", onKeyDown);
    return (): void => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
