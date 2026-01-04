/**
 * Clipboard slice for copy/cut/paste operations.
 * Supports both row-level (entire tasks) and cell-level (individual values) operations.
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import toast from "react-hot-toast";
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
  remapTaskIds,
  remapDependencies,
  determineInsertPosition,
  canPasteCellValue,
  getClearValueForField,
} from "../../utils/clipboard";
import {
  buildFlattenedTaskList,
  getTaskLevel,
  calculateSummaryDates,
} from "../../utils/hierarchy";

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

  // Helpers
  clearClipboard: () => void;
  getClipboardMode: () => "row" | "cell" | null;
  canPasteRows: () => boolean;
  canPasteCell: (targetField: EditableField) => boolean;
}

type ClipboardStore = ClipboardState & ClipboardActions;

export const useClipboardStore = create<ClipboardStore>()(
  immer((set, get) => ({
    // State
    rowClipboard: {
      tasks: [],
      dependencies: [],
      operation: null,
      sourceTaskIds: [],
    },
    cellClipboard: {
      value: null,
      field: null,
      operation: null,
      sourceTaskId: null,
    },
    activeMode: null,

    // Actions
    copyRows: (taskIds) => {
      const taskStore = useTaskStore.getState();
      const depStore = useDependencyStore.getState();
      const historyStore = useHistoryStore.getState();

      // Collect tasks with their children recursively
      const tasksToClone = collectTasksWithChildren(taskIds, taskStore.tasks);

      // Deep clone to avoid reference issues
      const clonedTasks = deepCloneTasks(tasksToClone);

      // Collect internal dependencies
      const internalDeps = collectInternalDependencies(
        clonedTasks,
        depStore.dependencies
      );

      set((state) => {
        // Clear cell clipboard (mutual exclusion)
        state.cellClipboard = {
          value: null,
          field: null,
          operation: null,
          sourceTaskId: null,
        };

        // Clear previous cut marks
        useTaskStore.setState({ cutTaskIds: [], cutCell: null });

        // Store in row clipboard
        state.rowClipboard = {
          tasks: clonedTasks,
          dependencies: internalDeps,
          operation: "copy",
          sourceTaskIds: taskIds,
        };
        state.activeMode = "row";
      });

      // Record command for undo/redo
      if (!historyStore.isUndoing && !historyStore.isRedoing) {
        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.COPY_ROWS,
          timestamp: Date.now(),
          description: `Copied ${taskIds.length} row(s)`,
          params: {
            taskIds,
            tasks: clonedTasks,
            dependencies: internalDeps,
          },
        });
      }
    },

    cutRows: (taskIds) => {
      const taskStore = useTaskStore.getState();
      const depStore = useDependencyStore.getState();
      const historyStore = useHistoryStore.getState();

      // Collect tasks with their children recursively
      const tasksToClone = collectTasksWithChildren(taskIds, taskStore.tasks);

      // Deep clone
      const clonedTasks = deepCloneTasks(tasksToClone);

      // Collect internal dependencies
      const internalDeps = collectInternalDependencies(
        clonedTasks,
        depStore.dependencies
      );

      set((state) => {
        // Clear cell clipboard (mutual exclusion)
        state.cellClipboard = {
          value: null,
          field: null,
          operation: null,
          sourceTaskId: null,
        };

        // Clear previous cut cell mark
        useTaskStore.setState({ cutCell: null });

        // Store in row clipboard
        state.rowClipboard = {
          tasks: clonedTasks,
          dependencies: internalDeps,
          operation: "cut",
          sourceTaskIds: taskIds,
        };
        state.activeMode = "row";
      });

      // Mark tasks as cut (visual feedback)
      useTaskStore.setState({ cutTaskIds: taskIds });

      // Record command
      if (!historyStore.isUndoing && !historyStore.isRedoing) {
        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.CUT_ROWS,
          timestamp: Date.now(),
          description: `Cut ${taskIds.length} row(s)`,
          params: {
            taskIds,
            tasks: clonedTasks,
            dependencies: internalDeps,
          },
        });
      }
    },

    pasteRows: () => {
      const { rowClipboard, activeMode } = get();
      const taskStore = useTaskStore.getState();
      const depStore = useDependencyStore.getState();
      const historyStore = useHistoryStore.getState();
      const fileStore = useFileStore.getState();

      // Validation
      if (activeMode !== "row" || !rowClipboard.operation) {
        return { success: false, error: "No rows in clipboard" };
      }

      // Build flattened list to determine visual insert position
      const collapsedIds = new Set(
        taskStore.tasks.filter((t) => t.open === false).map((t) => t.id)
      );
      const flattenedTasks = buildFlattenedTaskList(
        taskStore.tasks,
        collapsedIds
      );

      // Determine insert position in the flattened (visual) list
      const insertIndex = determineInsertPosition(
        taskStore.activeCell,
        taskStore.selectedTaskIds,
        flattenedTasks
      );

      // Get the actual ORDER value at the insert position
      // This is different from insertIndex because hidden tasks also have order values
      let insertOrder: number;
      let targetParent: string | undefined = undefined;
      let targetParentLevel = 0;

      if (insertIndex < flattenedTasks.length) {
        const taskAtPosition = flattenedTasks[insertIndex];
        insertOrder = taskAtPosition.task.order;
        targetParent = taskAtPosition.task.parent;
        // Calculate the level where we're inserting
        if (targetParent) {
          targetParentLevel = getTaskLevel(taskStore.tasks, targetParent) + 1;
        }
      } else {
        // Inserting at the end - use max order + 1
        insertOrder = Math.max(...taskStore.tasks.map((t) => t.order), -1) + 1;
      }

      // Generate new UUIDs and remap IDs
      const { remappedTasks, idMapping } = remapTaskIds(rowClipboard.tasks);

      // Calculate max depth of pasted tasks (relative to their roots)
      const pastedTaskIds = new Set(remappedTasks.map((t) => t.id));
      const getDepthInPasted = (task: Task): number => {
        let depth = 0;
        let current = task;
        while (current.parent && pastedTaskIds.has(current.parent)) {
          depth++;
          const parent = remappedTasks.find((t) => t.id === current.parent);
          if (!parent) break;
          current = parent;
        }
        return depth;
      };

      const maxPastedDepth = Math.max(
        ...remappedTasks.map(getDepthInPasted),
        0
      );
      const MAX_DEPTH = 3; // 0, 1, 2 (3 levels total)

      // Validate depth: targetParentLevel + maxPastedDepth must be < MAX_DEPTH
      if (targetParentLevel + maxPastedDepth >= MAX_DEPTH) {
        toast.error(
          `Cannot paste: would exceed maximum nesting depth of ${MAX_DEPTH} levels`
        );
        return { success: false, error: "Maximum nesting depth exceeded" };
      }

      // Remap dependencies
      const remappedDeps = remapDependencies(
        rowClipboard.dependencies,
        idMapping
      );

      // Clone current tasks and update order:
      // - Tasks with order >= insertOrder get shifted by the number of new tasks
      // - New tasks get order starting at insertOrder
      const currentTasks = taskStore.tasks.map((t) => {
        const cloned = { ...t };
        if (cloned.order >= insertOrder) {
          cloned.order += remappedTasks.length;
        }
        return cloned;
      });

      // Set order and parent for new tasks
      // Root tasks in the clipboard (no parent or parent not in clipboard) get the target parent
      const newTasks = remappedTasks.map((t, i) => {
        const isRootInClipboard = !t.parent || !pastedTaskIds.has(t.parent);
        return {
          ...t,
          order: insertOrder + i,
          // Assign target parent to root tasks, keep internal hierarchy for others
          parent: isRootInClipboard ? targetParent : t.parent,
        };
      });

      // Combine all tasks (order determines visual position, not array position)
      const updatedTasks = [...currentTasks, ...newTasks];

      // Store deleted tasks for undo (if cut operation)
      let deletedTasks: Task[] = [];
      let previousCutTaskIds: string[] = [];

      // If cut operation, collect tasks to delete for undo
      if (rowClipboard.operation === "cut") {
        previousCutTaskIds = rowClipboard.sourceTaskIds;
        deletedTasks = previousCutTaskIds
          .map((id) => taskStore.tasks.find((t) => t.id === id))
          .filter((t): t is Task => t !== undefined);
      }

      // Update task store
      useTaskStore.setState({ tasks: updatedTasks });

      // Recalculate summary dates if pasting under a summary parent
      if (targetParent) {
        const currentState = useTaskStore.getState();
        const parentTask = currentState.tasks.find(
          (t) => t.id === targetParent
        );
        if (parentTask && parentTask.type === "summary") {
          const summaryDates = calculateSummaryDates(
            currentState.tasks,
            targetParent
          );
          if (summaryDates) {
            const updatedTasksWithSummary = currentState.tasks.map((t) =>
              t.id === targetParent
                ? {
                    ...t,
                    startDate: summaryDates.startDate,
                    endDate: summaryDates.endDate,
                    duration: summaryDates.duration,
                  }
                : t
            );
            useTaskStore.setState({ tasks: updatedTasksWithSummary });
          }
        }
      }

      // Add dependencies
      const updatedDeps = [...depStore.dependencies, ...remappedDeps];
      useDependencyStore.setState({ dependencies: updatedDeps });

      // If cut operation, delete originals
      if (rowClipboard.operation === "cut") {
        // Delete all cut tasks at once (deep clone to avoid Immer frozen objects)
        const tasksAfterCut = useTaskStore
          .getState()
          .tasks.filter((t) => !previousCutTaskIds.includes(t.id))
          .map((t) => ({ ...t }));

        // Rebuild flattened list and update order to match visual position
        const collapsedIdsAfterCut = new Set(
          tasksAfterCut.filter((t) => t.open === false).map((t) => t.id)
        );
        const flattenedAfterCut = buildFlattenedTaskList(
          tasksAfterCut,
          collapsedIdsAfterCut
        );

        // Create order map from flattened list
        const orderMap = new Map<string, number>();
        flattenedAfterCut.forEach(({ task }, index) => {
          orderMap.set(task.id, index);
        });

        // Update order for all tasks based on their position in flattened list
        tasksAfterCut.forEach((task) => {
          const newOrder = orderMap.get(task.id);
          if (newOrder !== undefined) {
            task.order = newOrder;
          }
        });

        useTaskStore.setState({ tasks: tasksAfterCut });

        // Remove dependencies for deleted tasks
        const deps = useDependencyStore
          .getState()
          .dependencies.filter(
            (d) =>
              !previousCutTaskIds.includes(d.fromTaskId) &&
              !previousCutTaskIds.includes(d.toTaskId)
          );
        useDependencyStore.setState({ dependencies: deps });

        // Clear cut marks
        useTaskStore.setState({ cutTaskIds: [] });
      }

      // Mark file as dirty
      fileStore.markDirty();

      // Record command
      if (!historyStore.isUndoing && !historyStore.isRedoing) {
        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.PASTE_ROWS,
          timestamp: Date.now(),
          description: `Pasted ${remappedTasks.length} row(s)`,
          params: {
            pastedTasks: newTasks, // Use newTasks with correct order and parent
            pastedDependencies: remappedDeps,
            insertIndex: insertOrder, // Store the order value for undo
            idMapping,
            previousCutTaskIds:
              previousCutTaskIds.length > 0 ? previousCutTaskIds : undefined,
            deletedTasks: deletedTasks.length > 0 ? deletedTasks : undefined,
          },
        });
      }

      // Clear clipboard if it was a cut
      if (rowClipboard.operation === "cut") {
        set((state) => {
          state.rowClipboard = {
            tasks: [],
            dependencies: [],
            operation: null,
            sourceTaskIds: [],
          };
          state.activeMode = null;
        });
      }

      return { success: true };
    },

    copyCell: (taskId, field) => {
      const taskStore = useTaskStore.getState();
      const historyStore = useHistoryStore.getState();

      const task = taskStore.tasks.find((t) => t.id === taskId);
      if (!task) return;

      const value = task[field as keyof Task];

      set((state) => {
        // Clear row clipboard (mutual exclusion)
        state.rowClipboard = {
          tasks: [],
          dependencies: [],
          operation: null,
          sourceTaskIds: [],
        };

        // Clear cut marks
        useTaskStore.setState({ cutTaskIds: [], cutCell: null });

        // Store cell value
        state.cellClipboard = {
          value,
          field,
          operation: "copy",
          sourceTaskId: taskId,
        };
        state.activeMode = "cell";
      });

      // Record command
      if (!historyStore.isUndoing && !historyStore.isRedoing) {
        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.COPY_CELL,
          timestamp: Date.now(),
          description: `Copied ${field}`,
          params: {
            taskId,
            field,
            value,
          },
        });
      }
    },

    cutCell: (taskId, field) => {
      const taskStore = useTaskStore.getState();
      const historyStore = useHistoryStore.getState();

      const task = taskStore.tasks.find((t) => t.id === taskId);
      if (!task) return;

      const value = task[field as keyof Task];

      set((state) => {
        // Clear row clipboard (mutual exclusion)
        state.rowClipboard = {
          tasks: [],
          dependencies: [],
          operation: null,
          sourceTaskIds: [],
        };

        // Clear previous row cut marks
        useTaskStore.setState({ cutTaskIds: [] });

        // Store cell value
        state.cellClipboard = {
          value,
          field,
          operation: "cut",
          sourceTaskId: taskId,
        };
        state.activeMode = "cell";
      });

      // Mark cell as cut (visual feedback)
      useTaskStore.setState({ cutCell: { taskId, field } });

      // Record command
      if (!historyStore.isUndoing && !historyStore.isRedoing) {
        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.CUT_CELL,
          timestamp: Date.now(),
          description: `Cut ${field}`,
          params: {
            taskId,
            field,
            value,
          },
        });
      }
    },

    pasteCell: (targetTaskId, targetField) => {
      const { cellClipboard, activeMode } = get();
      const taskStore = useTaskStore.getState();
      const historyStore = useHistoryStore.getState();
      const fileStore = useFileStore.getState();

      // Validation
      if (activeMode !== "cell" || !cellClipboard.operation) {
        toast.error("No cell value in clipboard");
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
          toast.error(validation.error || "Cannot paste");
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

      // Record command
      if (!historyStore.isUndoing && !historyStore.isRedoing) {
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
          },
        });
      }

      // Clear clipboard if it was a cut
      if (cellClipboard.operation === "cut") {
        set((state) => {
          state.cellClipboard = {
            value: null,
            field: null,
            operation: null,
            sourceTaskId: null,
          };
          state.activeMode = null;
        });
      }

      return { success: true };
    },

    clearClipboard: () => {
      set((state) => {
        state.rowClipboard = {
          tasks: [],
          dependencies: [],
          operation: null,
          sourceTaskIds: [],
        };
        state.cellClipboard = {
          value: null,
          field: null,
          operation: null,
          sourceTaskId: null,
        };
        state.activeMode = null;
      });

      // Clear cut marks
      useTaskStore.setState({ cutTaskIds: [], cutCell: null });
    },

    getClipboardMode: () => get().activeMode,

    canPasteRows: () => {
      const { rowClipboard, activeMode } = get();
      return activeMode === "row" && rowClipboard.operation !== null;
    },

    canPasteCell: (targetField) => {
      const { cellClipboard, activeMode } = get();
      return (
        activeMode === "cell" &&
        cellClipboard.operation !== null &&
        cellClipboard.field === targetField
      );
    },
  }))
);
