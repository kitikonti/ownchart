/**
 * useHomeTabActions - Business logic hook for the Home tab ribbon content.
 *
 * Extracts store bindings, derived state, and action handlers from HomeTabContent
 * so the component stays purely presentational (<200 LOC).
 */

import { useMemo } from "react";
import { useTaskStore } from "../store/slices/taskSlice";
import { useChartStore } from "../store/slices/chartSlice";
import { useHistoryStore } from "../store/slices/historySlice";
import { useClipboardOperations } from "./useClipboardOperations";
import { useHideOperations } from "./useHideOperations";
import { COLORS } from "../styles/design-tokens";

const DEFAULT_NEW_TASK_DURATION_DAYS = 7;
const DEFAULT_TASK_NAME = "New Task";

interface HomeTabActions {
  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoDescription: string | null;
  redoDescription: string | null;
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
  // Task store — use taskCount instead of full tasks array to avoid
  // re-renders on every task edit (only re-renders when count changes)
  const taskCount = useTaskStore((state) => state.tasks.length);
  const addTask = useTaskStore((state) => state.addTask);
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
  const canIndent = useTaskStore((state) => state.canIndentSelection());
  const canOutdent = useTaskStore((state) => state.canOutdentSelection());
  const groupSelectedTasks = useTaskStore((state) => state.groupSelectedTasks);
  const canGroup = useTaskStore((state) => state.canGroupSelection());
  const ungroupSelectedTasks = useTaskStore(
    (state) => state.ungroupSelectedTasks
  );
  const canUngroup = useTaskStore((state) => state.canUngroupSelection());

  // History store
  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);
  const canUndo = useHistoryStore((state) => state.canUndo());
  const canRedo = useHistoryStore((state) => state.canRedo());
  const undoDescription = useHistoryStore((state) =>
    state.getUndoDescription()
  );
  const redoDescription = useHistoryStore((state) =>
    state.getRedoDescription()
  );

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
  const singleSelectedTaskId =
    selectedTaskIds.length === 1
      ? selectedTaskIds[0]
      : selectedTaskIds.length === 0 && activeCell.taskId
        ? activeCell.taskId
        : null;

  const canInsert = singleSelectedTaskId !== null;
  const canDelete = selectedTaskIds.length > 0;
  const canHide = selectedTaskIds.length > 0;

  // Handlers
  const handleAddTask = (): void => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + DEFAULT_NEW_TASK_DURATION_DAYS - 1);

    const formatDate = (date: Date): string => date.toISOString().split("T")[0];

    addTask({
      name: DEFAULT_TASK_NAME,
      startDate: formatDate(today),
      endDate: formatDate(endDate),
      duration: DEFAULT_NEW_TASK_DURATION_DAYS,
      progress: 0,
      color: COLORS.chart.taskDefault,
      order: taskCount,
      type: "task",
      parent: undefined,
      metadata: {},
    });
  };

  const handleInsertAbove = (): void => {
    if (singleSelectedTaskId) insertTaskAbove(singleSelectedTaskId);
  };

  const handleInsertBelow = (): void => {
    if (singleSelectedTaskId) insertTaskBelow(singleSelectedTaskId);
  };

  const handleHideRows = (): void => {
    hideRows(selectedTaskIds);
  };

  const handleUnhideSelection = (): void => {
    unhideSelection(selectedTaskIds);
  };

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    undoDescription,
    redoDescription,
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
