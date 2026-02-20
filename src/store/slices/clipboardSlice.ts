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
  pasteRows: () => { success: boolean; error?: string };

  // Cell operations
  copyCell: (taskId: string, field: EditableField) => void;
  cutCell: (taskId: string, field: EditableField) => void;
  pasteCell: (
    taskId: string,
    field: EditableField
  ) => { success: boolean; error?: string };

  // External clipboard operations (for cross-tab paste)
  pasteExternalRows: (data: SystemRowClipboardData) => {
    success: boolean;
    error?: string;
  };
  pasteExternalCell: (
    data: SystemCellClipboardData,
    targetTaskId: string,
    targetField: EditableField
  ) => { success: boolean; error?: string };

  // Helpers
  clearClipboard: () => void;
  getClipboardMode: () => "row" | "cell" | null;
  canPasteRows: () => boolean;
  canPasteCell: (targetField: EditableField) => boolean;
}

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

function performRowCopyOrCut(
  taskIds: string[],
  operation: "copy" | "cut",
  set: (fn: (state: ClipboardState) => void) => void
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
    state.cellClipboard = { ...EMPTY_CELL_CLIPBOARD };
    state.rowClipboard = {
      ...EMPTY_ROW_CLIPBOARD,
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
  set: (fn: (state: ClipboardState) => void) => void
): void {
  const task = useTaskStore.getState().tasks.find((t) => t.id === taskId);
  if (!task) return;

  const value = task[field as keyof Task];

  set((state) => {
    state.rowClipboard = { ...EMPTY_ROW_CLIPBOARD };
    state.cellClipboard = { value, field, operation, sourceTaskId: taskId };
    state.activeMode = "cell";
  });

  // Visual feedback (outside Immer)
  useTaskStore.setState({
    clipboardTaskIds: [],
    cutCell: operation === "cut" ? { taskId, field } : null,
  });
}

export const useClipboardStore = create<ClipboardStore>()(
  immer((set, get) => ({
    // State
    rowClipboard: { ...EMPTY_ROW_CLIPBOARD },
    cellClipboard: { ...EMPTY_CELL_CLIPBOARD },
    activeMode: null,

    // Actions
    copyRows: (taskIds): void => performRowCopyOrCut(taskIds, "copy", set),
    cutRows: (taskIds): void => performRowCopyOrCut(taskIds, "cut", set),

    pasteRows: (): { success: boolean; error?: string } => {
      const { rowClipboard, activeMode } = get();
      const taskStore = useTaskStore.getState();
      const depStore = useDependencyStore.getState();
      const historyStore = useHistoryStore.getState();
      const fileStore = useFileStore.getState();

      // Validation
      if (activeMode !== "row" || !rowClipboard.operation) {
        return { success: false, error: "No rows in clipboard" };
      }

      // Prepare paste data
      const result = prepareRowPaste({
        clipboardTasks: rowClipboard.tasks,
        clipboardDependencies: rowClipboard.dependencies,
        currentTasks: taskStore.tasks,
        activeCell: taskStore.activeCell,
        selectedTaskIds: taskStore.selectedTaskIds,
      });

      if ("error" in result) {
        return { success: false, error: result.error };
      }

      const {
        mergedTasks,
        newTasks,
        remappedDependencies,
        idMapping,
        insertOrder,
        targetParent,
      } = result;

      // Store deleted tasks for undo (if cut operation)
      let deletedTasks: Task[] = [];
      let previousCutTaskIds: string[] = [];

      if (rowClipboard.operation === "cut") {
        previousCutTaskIds = rowClipboard.sourceTaskIds;
        deletedTasks = previousCutTaskIds
          .map((id) => taskStore.tasks.find((t) => t.id === id))
          .filter((t): t is Task => t !== undefined);
      }

      // Apply summary recalculation
      let finalTasks = applySummaryRecalculation(mergedTasks, targetParent);

      // If cut operation, remove originals and rebuild order
      if (rowClipboard.operation === "cut") {
        const cutIds = new Set(previousCutTaskIds); // N1: Set instead of Array.includes

        finalTasks = finalTasks
          .filter((t) => !cutIds.has(t.id))
          .map((t) => ({ ...t }));

        // Rebuild order from flattened list
        const collapsedIdsAfterCut = new Set(
          finalTasks.filter((t) => t.open === false).map((t) => t.id)
        );
        const flattenedAfterCut = buildFlattenedTaskList(
          finalTasks,
          collapsedIdsAfterCut
        );
        const orderMap = new Map<string, number>();
        flattenedAfterCut.forEach(({ task }, index) => {
          orderMap.set(task.id, index);
        });
        finalTasks.forEach((task) => {
          const newOrder = orderMap.get(task.id);
          if (newOrder !== undefined) {
            task.order = newOrder;
          }
        });

        // Remove dependencies for deleted tasks and add new ones
        const updatedDeps = [
          ...depStore.dependencies,
          ...remappedDependencies,
        ].filter((d) => !cutIds.has(d.fromTaskId) && !cutIds.has(d.toTaskId));

        // W7: Single atomic setState for cut path
        useTaskStore.setState({ tasks: finalTasks, clipboardTaskIds: [] });
        useDependencyStore.setState({ dependencies: updatedDeps });
      } else {
        // W7: Single atomic setState for copy path
        useTaskStore.setState({ tasks: finalTasks });
        const updatedDeps = [...depStore.dependencies, ...remappedDependencies];
        useDependencyStore.setState({ dependencies: updatedDeps });
      }

      // Mark file as dirty
      fileStore.markDirty();

      // Record command (historySlice.recordCommand has internal undo/redo guard)
      historyStore.recordCommand({
        id: crypto.randomUUID(),
        type: CommandType.PASTE_ROWS,
        timestamp: Date.now(),
        description: `Pasted ${newTasks.length} row(s)`,
        params: {
          pastedTasks: newTasks,
          pastedDependencies: remappedDependencies,
          insertIndex: insertOrder,
          idMapping,
          previousCutTaskIds:
            previousCutTaskIds.length > 0 ? previousCutTaskIds : undefined,
          deletedTasks: deletedTasks.length > 0 ? deletedTasks : undefined,
        },
      });

      // Clear clipboard if it was a cut
      if (rowClipboard.operation === "cut") {
        set((state) => {
          state.rowClipboard = { ...EMPTY_ROW_CLIPBOARD };
          state.activeMode = null;
        });
      }

      return { success: true };
    },

    copyCell: (taskId, field): void =>
      performCellCopyOrCut(taskId, field, "copy", set),
    cutCell: (taskId, field): void =>
      performCellCopyOrCut(taskId, field, "cut", set),

    pasteCell: (
      targetTaskId,
      targetField
    ): { success: boolean; error?: string } => {
      const { cellClipboard, activeMode } = get();
      const taskStore = useTaskStore.getState();
      const historyStore = useHistoryStore.getState();
      const fileStore = useFileStore.getState();

      // Validation
      if (activeMode !== "cell" || !cellClipboard.operation) {
        return { success: false, error: "No cell in clipboard" };
      }

      // Get target task
      const task = taskStore.tasks.find((t) => t.id === targetTaskId);
      if (!task) {
        return { success: false, error: "Target task not found" };
      }

      // Field type matching validation
      if (cellClipboard.field) {
        const validation = canPasteCellValue(
          cellClipboard.field,
          targetField,
          task
        );
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
      }

      // Get current value (for undo)
      const previousValue = task[targetField as keyof Task];

      // Store cut cell info for undo
      let previousCutCell:
        | { taskId: string; field: string; value: unknown }
        | undefined;

      // If cut operation, prepare to clear source cell
      if (cellClipboard.operation === "cut" && cellClipboard.sourceTaskId) {
        const sourceTask = taskStore.tasks.find(
          (t) => t.id === cellClipboard.sourceTaskId
        );
        if (sourceTask && cellClipboard.field) {
          previousCutCell = {
            taskId: cellClipboard.sourceTaskId,
            field: cellClipboard.field,
            value: sourceTask[cellClipboard.field as keyof Task],
          };
        }
      }

      // Update target task
      taskStore.updateTask(targetTaskId, {
        [targetField]: cellClipboard.value,
      });

      // If cut operation, clear source cell
      if (
        cellClipboard.operation === "cut" &&
        cellClipboard.sourceTaskId &&
        cellClipboard.field
      ) {
        const clearValue = getClearValueForField(cellClipboard.field);
        taskStore.updateTask(cellClipboard.sourceTaskId, {
          [cellClipboard.field]: clearValue,
        });

        // Clear cut mark
        useTaskStore.setState({ cutCell: null });
      }

      // Mark file as dirty
      fileStore.markDirty();

      // Record command (historySlice.recordCommand has internal undo/redo guard)
      historyStore.recordCommand({
        id: crypto.randomUUID(),
        type: CommandType.PASTE_CELL,
        timestamp: Date.now(),
        description: `Pasted ${targetField}`,
        params: {
          taskId: targetTaskId,
          field: targetField,
          newValue: cellClipboard.value,
          previousValue,
          previousCutCell,
          cutClearValue:
            cellClipboard.operation === "cut" && cellClipboard.field
              ? getClearValueForField(cellClipboard.field)
              : undefined,
        },
      });

      // Clear clipboard if it was a cut
      if (cellClipboard.operation === "cut") {
        set((state) => {
          state.cellClipboard = { ...EMPTY_CELL_CLIPBOARD };
          state.activeMode = null;
        });
      }

      return { success: true };
    },

    pasteExternalRows: (
      data: SystemRowClipboardData
    ): { success: boolean; error?: string } => {
      const taskStore = useTaskStore.getState();
      const depStore = useDependencyStore.getState();
      const historyStore = useHistoryStore.getState();
      const fileStore = useFileStore.getState();

      // Validation
      if (!data.tasks || data.tasks.length === 0) {
        return { success: false, error: "No rows in external clipboard" };
      }

      // Prepare paste data
      const result = prepareRowPaste({
        clipboardTasks: data.tasks,
        clipboardDependencies: data.dependencies,
        currentTasks: taskStore.tasks,
        activeCell: taskStore.activeCell,
        selectedTaskIds: taskStore.selectedTaskIds,
      });

      if ("error" in result) {
        return { success: false, error: result.error };
      }

      const {
        mergedTasks,
        newTasks,
        remappedDependencies,
        idMapping,
        insertOrder,
        targetParent,
      } = result;

      // Apply summary recalculation and set state atomically
      const finalTasks = applySummaryRecalculation(mergedTasks, targetParent);
      useTaskStore.setState({ tasks: finalTasks });

      // Add dependencies
      useDependencyStore.setState({
        dependencies: [...depStore.dependencies, ...remappedDependencies],
      });

      // Mark file as dirty
      fileStore.markDirty();

      // Record command (historySlice.recordCommand has internal undo/redo guard)
      historyStore.recordCommand({
        id: crypto.randomUUID(),
        type: CommandType.PASTE_ROWS,
        timestamp: Date.now(),
        description: `Pasted ${newTasks.length} row(s) from external clipboard`,
        params: {
          pastedTasks: newTasks,
          pastedDependencies: remappedDependencies,
          insertIndex: insertOrder,
          idMapping,
        },
      });

      return { success: true };
    },

    pasteExternalCell: (
      data: SystemCellClipboardData,
      targetTaskId: string,
      targetField: EditableField
    ): { success: boolean; error?: string } => {
      const taskStore = useTaskStore.getState();
      const historyStore = useHistoryStore.getState();
      const fileStore = useFileStore.getState();

      // Get target task
      const task = taskStore.tasks.find((t) => t.id === targetTaskId);
      if (!task) {
        return { success: false, error: "Target task not found" };
      }

      // Field type matching validation
      const validation = canPasteCellValue(data.field, targetField, task);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Get current value (for undo)
      const previousValue = task[targetField as keyof Task];

      // Update target task
      taskStore.updateTask(targetTaskId, {
        [targetField]: data.value,
      });

      // Mark file as dirty
      fileStore.markDirty();

      // Record command (historySlice.recordCommand has internal undo/redo guard)
      historyStore.recordCommand({
        id: crypto.randomUUID(),
        type: CommandType.PASTE_CELL,
        timestamp: Date.now(),
        description: `Pasted ${targetField} from external clipboard`,
        params: {
          taskId: targetTaskId,
          field: targetField,
          newValue: data.value,
          previousValue,
        },
      });

      return { success: true };
    },

    clearClipboard: (): void => {
      set((state) => {
        state.rowClipboard = { ...EMPTY_ROW_CLIPBOARD };
        state.cellClipboard = { ...EMPTY_CELL_CLIPBOARD };
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

    canPasteCell: (targetField): boolean => {
      const { cellClipboard, activeMode } = get();
      return (
        activeMode === "cell" &&
        cellClipboard.operation !== null &&
        cellClipboard.field === targetField
      );
    },
  }))
);
