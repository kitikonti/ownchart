/**
 * Global keyboard shortcuts hook
 * Handles Ctrl+Z (undo), Ctrl+Shift+Z (redo), Ctrl+Y (redo alternative)
 * Handles Ctrl+S (save), Ctrl+Shift+S (save as), Ctrl+O (open), Ctrl+Alt+N (new)
 * Handles Ctrl+C (copy), Ctrl+X (cut), Ctrl+V (paste)
 * Handles Ctrl+E (open export dialog)
 * Handles ESC (close dialogs in priority order, then clear clipboard)
 * Handles ? (open help panel) — checked before shiftKey guard for US-keyboard compat
 * Handles D (toggle dependencies), T (toggle today marker)
 * Handles P (toggle progress column), H (toggle holidays)
 * Handles F (fit to view)
 * Handles Ctrl+H (hide selected rows), Ctrl+Shift+H (unhide hidden rows in selection)
 * Handles Ctrl+G (group), Ctrl+Shift+G (ungroup)
 */

import { useEffect, useRef } from "react";
import { useHistoryStore } from "../store/slices/historySlice";
import { useTaskStore } from "../store/slices/taskSlice";
import { useChartStore } from "../store/slices/chartSlice";
import { useUIStore } from "../store/slices/uiSlice";
import { useClipboardStore } from "../store/slices/clipboardSlice";
import { useFileOperations } from "./useFileOperations";
import { useClipboardOperations } from "./useClipboardOperations";
import { useHideOperations } from "./useHideOperations";
import { findTopmostSelectedTaskId } from "../utils/selection";
import type { Task } from "../types/chart.types";
import type { TaskId } from "../types/branded.types";
import type { EditableField } from "../types/task.types";

// ── OS detection ──────────────────────────────────────────────────────────────
// Computed once at module load — environment-stable, never changes at runtime.
// navigator.userAgentData.platform is the modern standard (Chromium 90+);
// navigator.platform is deprecated but remains the universal fallback.
const IS_MAC =
  // userAgentData is not yet in TypeScript's lib.dom.d.ts
  (navigator as Navigator & { userAgentData?: { platform?: string } })
    .userAgentData?.platform === "macOS" ||
  navigator.platform.toUpperCase().includes("MAC");

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns true when the focused element is a text-entry control.
 *  Checkbox inputs are intentionally excluded so that clipboard and other
 *  operations continue to work normally when a checkbox has focus. */
export function isTextInputElement(target: HTMLElement): boolean {
  return (
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable ||
    (target.tagName === "INPUT" &&
      (target as HTMLInputElement).type !== "checkbox")
  );
}

// ── Context ───────────────────────────────────────────────────────────────────
// A single snapshot of all state needed by the sub-handlers.  Built fresh on
// every render in useShortcutSubscriptions() and passed into every module-level
// handler so they remain pure functions with no closed-over stale values.

interface ActiveCell {
  taskId: TaskId | null;
  field: EditableField | null;
}

// Sub-interfaces grouped by concern — composed into ShortcutContext below.

interface HistoryContext {
  undo: () => void;
  redo: () => void;
}

interface FileContext {
  handleSave: () => void;
  handleSaveAs: () => void;
  handleOpen: () => void;
  handleNew: () => void;
}

interface ClipboardContext {
  handleCopy: () => void;
  handleCut: () => void;
  handlePaste: () => void;
  clearClipboard: () => void;
  clipboardMode: "row" | "cell" | null;
}

interface TaskContext {
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
}

interface ViewContext {
  toggleDependencies: () => void;
  toggleTodayMarker: () => void;
  toggleProgress: () => void;
  toggleHolidays: () => void;
  fitToView: (tasks: Task[]) => void;
}

interface HideContext {
  hideRows: (ids: TaskId[]) => void;
  unhideSelection: (ids: TaskId[]) => void;
}

interface UIContext {
  openExportDialog: () => void;
  openHelpPanel: () => void;
  closeExportDialog: () => void;
  closeHelpPanel: () => void;
  closeWelcomeTour: () => void;
  isExportDialogOpen: boolean;
  isHelpPanelOpen: boolean;
  isWelcomeTourOpen: boolean;
}

type ShortcutContext = HistoryContext &
  FileContext &
  ClipboardContext &
  TaskContext &
  ViewContext &
  HideContext &
  UIContext;

// ── Sub-handlers (module-level; return true when the event is consumed) ───────

export function handleUndoRedo(
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

export function handleFileShortcuts(
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

export function handleClipboardShortcuts(
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

export function handleEscapeKey(
  e: KeyboardEvent,
  ctx: ShortcutContext
): boolean {
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

export function handleDeleteShortcuts(
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

export function handleInsertShortcuts(
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

export function handleIndentShortcuts(
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

export function handleGroupShortcuts(
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

export function handleHideShortcuts(
  e: KeyboardEvent,
  modKey: boolean,
  ctx: ShortcutContext
): boolean {
  if (!modKey || ctx.isEditingCell || e.key.toLowerCase() !== "h") return false;
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

export function handleSingleKeyShortcuts(
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

// ── Per-domain subscription hooks ─────────────────────────────────────────────
// Each hook subscribes to one concern's Zustand state and returns a typed
// sub-context.  useShortcutSubscriptions() composes them into one snapshot
// that is built fresh on every render.
//
// When adding a shortcut: update (1) the matching sub-interface, (2) the
// matching sub-hook, and (3) the dispatcher chain in useKeyboardShortcuts.

function useHistoryContext(): HistoryContext {
  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);
  return { undo, redo };
}

function useFileContext(): FileContext {
  const { handleSave, handleSaveAs, handleOpen, handleNew } =
    useFileOperations();
  return { handleSave, handleSaveAs, handleOpen, handleNew };
}

function useClipboardContext(): ClipboardContext {
  const { handleCopy, handleCut, handlePaste } = useClipboardOperations();
  const clearClipboard = useClipboardStore((state) => state.clearClipboard);
  const clipboardMode = useClipboardStore((state) => state.activeMode);
  return { handleCopy, handleCut, handlePaste, clearClipboard, clipboardMode };
}

function useTaskContext(): TaskContext {
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
  return {
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
  };
}

function useViewContext(): ViewContext {
  const toggleDependencies = useChartStore((state) => state.toggleDependencies);
  const toggleTodayMarker = useChartStore((state) => state.toggleTodayMarker);
  const toggleProgress = useChartStore((state) => state.toggleProgress);
  const toggleHolidays = useChartStore((state) => state.toggleHolidays);
  const fitToView = useChartStore((state) => state.fitToView);
  return {
    toggleDependencies,
    toggleTodayMarker,
    toggleProgress,
    toggleHolidays,
    fitToView,
  };
}

function useHideContext(): HideContext {
  const { hideRows, unhideSelection } = useHideOperations();
  return { hideRows, unhideSelection };
}

function useUIContext(): UIContext {
  const openExportDialog = useUIStore((state) => state.openExportDialog);
  const openHelpPanel = useUIStore((state) => state.openHelpPanel);
  const closeExportDialog = useUIStore((state) => state.closeExportDialog);
  const closeHelpPanel = useUIStore((state) => state.closeHelpPanel);
  const closeWelcomeTour = useUIStore((state) => state.dismissWelcome);
  const isExportDialogOpen = useUIStore((state) => state.isExportDialogOpen);
  const isHelpPanelOpen = useUIStore((state) => state.isHelpPanelOpen);
  const isWelcomeTourOpen = useUIStore((state) => state.isWelcomeTourOpen);
  return {
    openExportDialog,
    openHelpPanel,
    closeExportDialog,
    closeHelpPanel,
    closeWelcomeTour,
    isExportDialogOpen,
    isHelpPanelOpen,
    isWelcomeTourOpen,
  };
}

function useShortcutSubscriptions(): ShortcutContext {
  return {
    ...useHistoryContext(),
    ...useFileContext(),
    ...useClipboardContext(),
    ...useTaskContext(),
    ...useViewContext(),
    ...useHideContext(),
    ...useUIContext(),
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useKeyboardShortcuts(): void {
  const ctx = useShortcutSubscriptions();

  // The event listener is registered once (empty dep array below).
  // On every render, handlerRef.current is replaced with a fresh closure so
  // all sub-handlers always see the latest Zustand-subscribed values.
  // This prevents the listener from being torn down and re-added on every
  // task edit, selection change, or cell navigation.
  const handlerRef = useRef<(e: KeyboardEvent) => void>(() => {});

  handlerRef.current = (e: KeyboardEvent): void => {
    const modKey = IS_MAC ? e.metaKey : e.ctrlKey;

    const target = e.target as HTMLElement | null;
    if (!target) return;

    if (isTextInputElement(target)) return;

    const isCellActive = ctx.activeCell.taskId !== null;

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
