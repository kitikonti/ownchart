/**
 * Clipboard slice for copy/cut/paste operations.
 * Supports both row-level (entire tasks) and cell-level (individual values) operations.
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Task } from "../../types/chart.types";
import type { Dependency } from "../../types/dependency.types";
import type { EditableField } from "./taskSlice";
import { useTaskStore } from "./taskSlice";
import { useDependencyStore } from "./dependencySlice";
import { useHistoryStore } from "./historySlice";
import { useFileStore } from "./fileSlice";
import { CommandType } from "../../types/command.types";
import {
  collectTasksWithChildren,
  deepCloneTasks,
  collectInternalDependencies,
  prepareRowPaste,
  applySummaryRecalculation,
  canPasteCellValue,
  getClearValueForField,
  type PrepareRowPasteResult,
  type SystemRowClipboardData,
  type SystemCellClipboardData,
} from "../../utils/clipboard";
import { buildFlattenedTaskList } from "../../utils/hierarchy";

interface ClipboardState {
  // Row clipboard (for whole tasks)
  rowClipboard: {
    tasks: Task[];
    dependencies: Dependency[];
    operation: "copy" | "cut" | null;
    sourceTaskIds: string[];
  };

  // Cell clipboard (for individual field values)
  cellClipboard: {
    value: unknown;
    field: EditableField | null;
    operation: "copy" | "cut" | null;
    sourceTaskId: string | null;
  };

  // Active clipboard mode (mutual exclusion)
  activeMode: "row" | "cell" | null;
}

interface ClipboardActions {
  // Row operations
  copyRows: (taskIds: string[]) => void;
  cutRows: (taskIds: string[]) => void;
  pasteRows: () => PasteResult;

  // Cell operations
  copyCell: (taskId: string, field: EditableField) => void;
  cutCell: (taskId: string, field: EditableField) => void;
  pasteCell: (taskId: string, field: EditableField) => PasteResult;

  // External clipboard operations (for cross-tab paste)
  pasteExternalRows: (data: SystemRowClipboardData) => PasteResult;
  pasteExternalCell: (
    data: SystemCellClipboardData,
    targetTaskId: string,
    targetField: EditableField
  ) => PasteResult;

  // Helpers
  clearClipboard: () => void;
  getClipboardMode: () => "row" | "cell" | null;
  canPasteRows: () => boolean;
  canPasteCell: (targetField: EditableField, targetTaskId?: string) => boolean;
}

type ClipboardSetter = (fn: (state: ClipboardState) => void) => void;
type PasteResult = { success: boolean; error?: string };
type ClipboardStore = ClipboardState & ClipboardActions;

// ---------------------------------------------------------------------------
// Empty clipboard constants (avoid repetitive object literals)
// ---------------------------------------------------------------------------

const EMPTY_ROW_CLIPBOARD: ClipboardState["rowClipboard"] = {
  tasks: [],
  dependencies: [],
  operation: null,
  sourceTaskIds: [],
};

const EMPTY_CELL_CLIPBOARD: ClipboardState["cellClipboard"] = {
  value: null,
  field: null,
  operation: null,
  sourceTaskId: null,
};

// ---------------------------------------------------------------------------
// Shared helpers (standalone, used by store actions)
// ---------------------------------------------------------------------------

/** Type-safe accessor for EditableField values on a Task. */
function getTaskFieldValue(task: Task, field: EditableField): unknown {
  // EditableField is a subset of keyof Task — safe cast
  return task[field as keyof Task];
}

function performRowCopyOrCut(
  taskIds: string[],
  operation: "copy" | "cut",
  set: ClipboardSetter
): void {
  const taskStore = useTaskStore.getState();
  const depStore = useDependencyStore.getState();

  const tasksToClone = collectTasksWithChildren(taskIds, taskStore.tasks);
  const clonedTasks = deepCloneTasks(tasksToClone);
  const internalDeps = collectInternalDependencies(
    clonedTasks,
    depStore.dependencies
  );

  set((state) => {
    state.cellClipboard = EMPTY_CELL_CLIPBOARD;
    state.rowClipboard = {
      tasks: clonedTasks,
      dependencies: internalDeps,
      operation,
      sourceTaskIds: taskIds,
    };
    state.activeMode = "row";
  });

  // Visual feedback (outside Immer)
  useTaskStore.setState({ clipboardTaskIds: taskIds, cutCell: null });
}

function performCellCopyOrCut(
  taskId: string,
  field: EditableField,
  operation: "copy" | "cut",
  set: ClipboardSetter
): void {
  const task = useTaskStore.getState().tasks.find((t) => t.id === taskId);
  if (!task) return;

  const value = getTaskFieldValue(task, field);

  set((state) => {
    state.rowClipboard = EMPTY_ROW_CLIPBOARD;
    state.cellClipboard = { value, field, operation, sourceTaskId: taskId };
    state.activeMode = "cell";
  });

  // Visual feedback (outside Immer)
  useTaskStore.setState({
    clipboardTaskIds: [],
    cutCell: operation === "cut" ? { taskId, field } : null,
  });
}

interface RowPasteParams {
  clipboardTasks: Task[];
  clipboardDependencies: Dependency[];
  /** Set to "cut" + provide sourceTaskIds when pasting from an internal cut. */
  operation?: "copy" | "cut";
  sourceTaskIds?: string[];
  /** Immer `set` — only needed when operation is "cut" (to clear clipboard). */
  set?: ClipboardSetter;
  description: string;
}

/** Collect undo data needed when pasting from a cut operation. */
function collectRowCutUndoData(
  operation: "copy" | "cut" | undefined,
  sourceTaskIds: string[],
  tasks: Task[]
): { previousCutTaskIds: string[]; deletedTasks: Task[] } {
  if (operation !== "cut") {
    return { previousCutTaskIds: [], deletedTasks: [] };
  }
  const deletedTasks = sourceTaskIds
    .map((id) => tasks.find((t) => t.id === id))
    .filter((t): t is Task => t !== undefined);
  return { previousCutTaskIds: sourceTaskIds, deletedTasks };
}

/** Apply paste results to task and dependency stores (handles cut vs copy). */
function applyRowPasteToStores(
  operation: "copy" | "cut" | undefined,
  finalTasks: Task[],
  cutTaskIds: string[],
  existingDeps: Dependency[],
  remappedDependencies: Dependency[]
): void {
  if (operation === "cut") {
    const cutResult = applyCutDeletion(
      finalTasks,
      new Set(cutTaskIds),
      existingDeps,
      remappedDependencies
    );
    useTaskStore.setState({ tasks: cutResult.tasks, clipboardTaskIds: [] });
    useDependencyStore.setState({ dependencies: cutResult.dependencies });
  } else {
    useTaskStore.setState({ tasks: finalTasks });
    useDependencyStore.setState({
      dependencies: [...existingDeps, ...remappedDependencies],
    });
  }
}

/** Record a row-paste command in the undo/redo history. */
function recordRowPasteCommand(
  description: string,
  pasteData: PrepareRowPasteResult,
  cutUndoData: { previousCutTaskIds: string[]; deletedTasks: Task[] }
): void {
  useHistoryStore.getState().recordCommand({
    id: crypto.randomUUID(),
    type: CommandType.PASTE_ROWS,
    timestamp: Date.now(),
    description,
    params: {
      pastedTasks: pasteData.newTasks,
      pastedDependencies: pasteData.remappedDependencies,
      insertIndex: pasteData.insertOrder,
      idMapping: pasteData.idMapping,
      previousCutTaskIds:
        cutUndoData.previousCutTaskIds.length > 0
          ? cutUndoData.previousCutTaskIds
          : undefined,
      deletedTasks:
        cutUndoData.deletedTasks.length > 0
          ? cutUndoData.deletedTasks
          : undefined,
    },
  });
}

/** Remove cut source tasks, rebuild order, and update dependencies. */
function applyCutDeletion(
  tasks: Task[],
  cutIds: Set<string>,
  existingDeps: Dependency[],
  remappedDependencies: Dependency[]
): { tasks: Task[]; dependencies: Dependency[] } {
  const filtered = tasks
    .filter((t) => !cutIds.has(t.id))
    .map((t) => ({ ...t }));

  // Rebuild order from flattened list — force all tasks expanded so ALL tasks
  // (including children of collapsed parents) get correct order values.
  const allExpanded = filtered.map((t) =>
    t.open === false ? { ...t, open: true } : t
  );
  const flattened = buildFlattenedTaskList(allExpanded, new Set<string>());
  const orderMap = new Map<string, number>();
  flattened.forEach(({ task }, index) => {
    orderMap.set(task.id, index);
  });
  filtered.forEach((task) => {
    const newOrder = orderMap.get(task.id);
    if (newOrder !== undefined) {
      task.order = newOrder;
    }
  });

  const dependencies = [...existingDeps, ...remappedDependencies].filter(
    (d) => !cutIds.has(d.fromTaskId) && !cutIds.has(d.toTaskId)
  );

  return { tasks: filtered, dependencies };
}

function executeRowPaste(params: RowPasteParams): PasteResult {
  const {
    clipboardTasks,
    clipboardDependencies,
    operation,
    sourceTaskIds = [],
    set,
    description,
  } = params;
  const taskStore = useTaskStore.getState();
  const depStore = useDependencyStore.getState();
  const fileStore = useFileStore.getState();

  const result = prepareRowPaste({
    clipboardTasks,
    clipboardDependencies,
    currentTasks: taskStore.tasks,
    activeCell: taskStore.activeCell,
    selectedTaskIds: taskStore.selectedTaskIds,
  });

  if ("error" in result) {
    return { success: false, error: result.error };
  }

  const cutUndoData = collectRowCutUndoData(
    operation,
    sourceTaskIds,
    taskStore.tasks
  );
  const finalTasks = applySummaryRecalculation(
    result.mergedTasks,
    result.targetParent
  );

  applyRowPasteToStores(
    operation,
    finalTasks,
    cutUndoData.previousCutTaskIds,
    depStore.dependencies,
    result.remappedDependencies
  );
  fileStore.markDirty();
  recordRowPasteCommand(description, result, cutUndoData);

  if (operation === "cut" && set) {
    set((state) => {
      state.rowClipboard = EMPTY_ROW_CLIPBOARD;
      state.activeMode = null;
    });
  }

  return { success: true };
}

interface CellPasteParams {
  value: unknown;
  sourceField: EditableField;
  targetTaskId: string;
  targetField: EditableField;
  /** Set when pasting from an internal cut operation. */
  cutSource?: { taskId: string; field: EditableField };
  /** Immer `set` — only needed for cut operations (to clear clipboard). */
  set?: ClipboardSetter;
  description: string;
}

/** Apply cell value mutation and clear cut source if applicable. */
function applyCellMutations(
  targetTaskId: string,
  targetField: EditableField,
  value: unknown,
  cutSource?: { taskId: string; field: EditableField }
): void {
  const taskStore = useTaskStore.getState();
  taskStore.updateTask(targetTaskId, { [targetField]: value });

  if (cutSource) {
    const clearValue = getClearValueForField(cutSource.field);
    taskStore.updateTask(cutSource.taskId, { [cutSource.field]: clearValue });
    useTaskStore.setState({ cutCell: null });
  }
}

/** Collect previous cut-cell value for undo support. */
function collectCutCellUndoData(
  tasks: Task[],
  cutSource: { taskId: string; field: EditableField }
): { taskId: string; field: string; value: unknown } | undefined {
  const sourceTask = tasks.find((t) => t.id === cutSource.taskId);
  if (!sourceTask) return undefined;
  return {
    taskId: cutSource.taskId,
    field: cutSource.field,
    value: getTaskFieldValue(sourceTask, cutSource.field),
  };
}

function executeCellPaste(params: CellPasteParams): PasteResult {
  const {
    value,
    sourceField,
    targetTaskId,
    targetField,
    cutSource,
    set,
    description,
  } = params;
  const taskStore = useTaskStore.getState();
  const fileStore = useFileStore.getState();

  const task = taskStore.tasks.find((t) => t.id === targetTaskId);
  if (!task) {
    return { success: false, error: "Target task not found" };
  }

  const validation = canPasteCellValue(sourceField, targetField, task);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const previousValue = getTaskFieldValue(task, targetField);
  const previousCutCell = cutSource
    ? collectCutCellUndoData(taskStore.tasks, cutSource)
    : undefined;

  applyCellMutations(targetTaskId, targetField, value, cutSource);
  fileStore.markDirty();

  useHistoryStore.getState().recordCommand({
    id: crypto.randomUUID(),
    type: CommandType.PASTE_CELL,
    timestamp: Date.now(),
    description,
    params: {
      taskId: targetTaskId,
      field: targetField,
      newValue: value,
      previousValue,
      previousCutCell,
      cutClearValue: cutSource
        ? getClearValueForField(cutSource.field)
        : undefined,
    },
  });

  if (cutSource && set) {
    set((state) => {
      state.cellClipboard = EMPTY_CELL_CLIPBOARD;
      state.activeMode = null;
    });
  }

  return { success: true };
}

export const useClipboardStore = create<ClipboardStore>()(
  immer((set, get) => ({
    // State
    rowClipboard: EMPTY_ROW_CLIPBOARD,
    cellClipboard: EMPTY_CELL_CLIPBOARD,
    activeMode: null,

    // Actions
    copyRows: (taskIds): void => performRowCopyOrCut(taskIds, "copy", set),
    cutRows: (taskIds): void => performRowCopyOrCut(taskIds, "cut", set),

    pasteRows: (): PasteResult => {
      const { rowClipboard, activeMode } = get();
      if (activeMode !== "row" || !rowClipboard.operation) {
        return { success: false, error: "No rows in clipboard" };
      }
      return executeRowPaste({
        clipboardTasks: rowClipboard.tasks,
        clipboardDependencies: rowClipboard.dependencies,
        operation: rowClipboard.operation,
        sourceTaskIds: rowClipboard.sourceTaskIds,
        set,
        description: "Pasted row(s)",
      });
    },

    copyCell: (taskId, field): void =>
      performCellCopyOrCut(taskId, field, "copy", set),
    cutCell: (taskId, field): void =>
      performCellCopyOrCut(taskId, field, "cut", set),

    pasteCell: (targetTaskId, targetField): PasteResult => {
      const { cellClipboard, activeMode } = get();
      if (activeMode !== "cell" || !cellClipboard.operation) {
        return { success: false, error: "No cell in clipboard" };
      }
      if (!cellClipboard.field) {
        return { success: false, error: "No cell field in clipboard" };
      }
      const cutSource =
        cellClipboard.operation === "cut" && cellClipboard.sourceTaskId
          ? {
              taskId: cellClipboard.sourceTaskId,
              field: cellClipboard.field,
            }
          : undefined;
      return executeCellPaste({
        value: cellClipboard.value,
        sourceField: cellClipboard.field,
        targetTaskId,
        targetField,
        cutSource,
        set,
        description: `Pasted ${targetField}`,
      });
    },

    pasteExternalRows: (data: SystemRowClipboardData): PasteResult => {
      if (!data.tasks || data.tasks.length === 0) {
        return { success: false, error: "No rows in external clipboard" };
      }
      return executeRowPaste({
        clipboardTasks: data.tasks,
        clipboardDependencies: data.dependencies,
        description: "Pasted row(s) from external clipboard",
      });
    },

    pasteExternalCell: (
      data: SystemCellClipboardData,
      targetTaskId: string,
      targetField: EditableField
    ): PasteResult =>
      executeCellPaste({
        value: data.value,
        sourceField: data.field,
        targetTaskId,
        targetField,
        description: `Pasted ${targetField} from external clipboard`,
      }),

    clearClipboard: (): void => {
      set((state) => {
        state.rowClipboard = EMPTY_ROW_CLIPBOARD;
        state.cellClipboard = EMPTY_CELL_CLIPBOARD;
        state.activeMode = null;
      });

      // Clear clipboard marks
      useTaskStore.setState({ clipboardTaskIds: [], cutCell: null });
    },

    getClipboardMode: (): "row" | "cell" | null => get().activeMode,

    canPasteRows: (): boolean => {
      const { rowClipboard, activeMode } = get();
      return activeMode === "row" && rowClipboard.operation !== null;
    },

    canPasteCell: (targetField, targetTaskId): boolean => {
      const { cellClipboard, activeMode } = get();
      if (
        activeMode !== "cell" ||
        cellClipboard.operation === null ||
        cellClipboard.field !== targetField
      ) {
        return false;
      }
      if (targetTaskId && cellClipboard.field) {
        const task = useTaskStore
          .getState()
          .tasks.find((t) => t.id === targetTaskId);
        if (!task) return false;
        return canPasteCellValue(cellClipboard.field, targetField, task).valid;
      }
      return true;
    },
  }))
);
