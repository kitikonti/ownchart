/**
 * useHomeTabActions - Business logic hook for the Home tab ribbon content.
 *
 * Extracts store bindings, derived state, and action handlers from HomeTabContent
 * so the component stays purely presentational (<200 LOC).
 */

import { useMemo, useCallback } from "react";
import { useTaskStore } from "@/store/slices/taskSlice";
import { useChartStore } from "@/store/slices/chartSlice";
import { useHistoryStore } from "@/store/slices/historySlice";
import { useClipboardOperations } from "./useClipboardOperations";
import { useHideOperations } from "./useHideOperations";
import { useNewTaskCreation } from "./useNewTaskCreation";
import { DEFAULT_TASK_NAME } from "@/store/slices/taskSliceHelpers";

interface HomeTabActions {
  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoDescription: string;
  redoDescription: string;
  // Clipboard
  handleCopy: () => void;
  handleCut: () => void;
  handlePaste: () => void;
  canCopyOrCut: boolean;
  canPaste: boolean;
  deleteSelectedTasks: () => void;
  canDelete: boolean;
  // Add & Insert
  handleAddTask: () => void;
  handleInsertAbove: () => void;
  handleInsertBelow: () => void;
  canInsert: boolean;
  // Hierarchy
  indentSelectedTasks: () => void;
  outdentSelectedTasks: () => void;
  canIndent: boolean;
  canOutdent: boolean;
  groupSelectedTasks: () => void;
  ungroupSelectedTasks: () => void;
  canGroup: boolean;
  canUngroup: boolean;
  // Hide/Show
  handleHideRows: () => void;
  handleUnhideSelection: () => void;
  canHide: boolean;
  hiddenInSelectionCount: number;
  totalHiddenCount: number;
}

export function useHomeTabActions(): HomeTabActions {
  // Task store
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const activeCell = useTaskStore((state) => state.activeCell);
  const insertTaskAbove = useTaskStore((state) => state.insertTaskAbove);
  const insertTaskBelow = useTaskStore((state) => state.insertTaskBelow);
  const deleteSelectedTasks = useTaskStore(
    (state) => state.deleteSelectedTasks
  );
  const indentSelectedTasks = useTaskStore(
    (state) => state.indentSelectedTasks
  );
  const outdentSelectedTasks = useTaskStore(
    (state) => state.outdentSelectedTasks
  );
  // canIndent/canOutdent/canGroup/canUngroup are derived booleans computed from
  // selectedTaskIds + task hierarchy. Calling methods inside the selector is
  // intentional: Zustand re-runs the selector on every store update, but the
  // boolean result is compared by value so re-renders only occur when the
  // value actually changes.
  const canIndent = useTaskStore((state) => state.canIndentSelection());
  const canOutdent = useTaskStore((state) => state.canOutdentSelection());
  const groupSelectedTasks = useTaskStore((state) => state.groupSelectedTasks);
  // canGroup/canUngroup: same selector-method pattern as canIndent/canOutdent above —
  // Zustand re-runs the selector on every store update but only re-renders when
  // the returned boolean value actually changes.
  const canGroup = useTaskStore((state) => state.canGroupSelection());
  const ungroupSelectedTasks = useTaskStore(
    (state) => state.ungroupSelectedTasks
  );
  const canUngroup = useTaskStore((state) => state.canUngroupSelection());

  // History store
  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);
  // canUndo/canRedo/descriptions are computed from stack lengths and only
  // change when an undo/redo operation occurs; calling methods inside the
  // selector is intentional — Zustand re-runs the selector on store changes
  // but only re-renders when the returned value differs by reference/value.
  const canUndo = useHistoryStore((state) => state.canUndo());
  const canRedo = useHistoryStore((state) => state.canRedo());
  const undoDescription = useHistoryStore((state) =>
    state.getUndoDescription()
  );
  const redoDescription = useHistoryStore((state) =>
    state.getRedoDescription()
  );

  // New task creation — delegates to useNewTaskCreation so ordering logic
  // (maxOrder + 1, date anchoring) stays in one place, consistent with the
  // placeholder row's "Add Task" flow.
  const { createTask } = useNewTaskCreation();

  // Clipboard
  const { handleCopy, handleCut, handlePaste, canCopyOrCut, canPaste } =
    useClipboardOperations();

  // Hidden tasks — subscribe to length only, not the full array
  const totalHiddenCount = useChartStore((state) => state.hiddenTaskIds.length);
  const { hideRows, unhideSelection, getHiddenInSelectionCount } =
    useHideOperations();
  const hiddenInSelectionCount = useMemo(
    () => getHiddenInSelectionCount(selectedTaskIds),
    [getHiddenInSelectionCount, selectedTaskIds]
  );

  // Derived state
  const singleSelectedTaskId = useMemo(
    () =>
      selectedTaskIds.length === 1
        ? selectedTaskIds[0]
        : selectedTaskIds.length === 0 && activeCell.taskId
          ? activeCell.taskId
          : null,
    [selectedTaskIds, activeCell.taskId]
  );

  const canInsert = singleSelectedTaskId !== null;
  const canDelete = selectedTaskIds.length > 0;
  const canHide = selectedTaskIds.length > 0;

  // Handlers
  const handleAddTask = useCallback((): void => {
    createTask(DEFAULT_TASK_NAME);
  }, [createTask]);

  const handleInsertAbove = useCallback((): void => {
    if (singleSelectedTaskId) insertTaskAbove(singleSelectedTaskId);
  }, [insertTaskAbove, singleSelectedTaskId]);

  const handleInsertBelow = useCallback((): void => {
    if (singleSelectedTaskId) insertTaskBelow(singleSelectedTaskId);
  }, [insertTaskBelow, singleSelectedTaskId]);

  const handleHideRows = useCallback((): void => {
    hideRows(selectedTaskIds);
  }, [hideRows, selectedTaskIds]);

  const handleUnhideSelection = useCallback((): void => {
    unhideSelection(selectedTaskIds);
  }, [unhideSelection, selectedTaskIds]);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    undoDescription: undoDescription ?? "",
    redoDescription: redoDescription ?? "",
    handleCopy,
    handleCut,
    handlePaste,
    canCopyOrCut,
    canPaste,
    deleteSelectedTasks,
    canDelete,
    handleAddTask,
    handleInsertAbove,
    handleInsertBelow,
    canInsert,
    indentSelectedTasks,
    outdentSelectedTasks,
    canIndent,
    canOutdent,
    groupSelectedTasks,
    ungroupSelectedTasks,
    canGroup,
    canUngroup,
    handleHideRows,
    handleUnhideSelection,
    canHide,
    hiddenInSelectionCount,
    totalHiddenCount,
  };
}
