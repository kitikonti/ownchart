/**
 * History slice for undo/redo functionality
 * Manages command stacks and provides undo/redo operations
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import toast from "react-hot-toast";
import type {
  Command,
  AddTaskParams,
  UpdateTaskParams,
  AddDependencyParams,
  DeleteDependencyParams,
  UpdateDependencyParams,
  PasteRowsParams,
  PasteCellParams,
  MultiDragTasksParams,
  ApplyColorsToManualParams,
  GroupTasksParams,
  UngroupTasksParams,
  HideTasksParams,
  UnhideTasksParams,
} from "../../types/command.types";
import { calculateDuration } from "../../utils/dateUtils";
import { useTaskStore } from "./taskSlice";
import { useDependencyStore } from "./dependencySlice";
import { useChartStore } from "./chartSlice";
import { useFileStore } from "./fileSlice";
import {
  recalculateSummaryAncestors,
  normalizeTaskOrder,
} from "../../utils/hierarchy";

interface HistoryState {
  undoStack: Command[];
  redoStack: Command[];
  maxStackSize: number;
  isUndoing: boolean; // Flag to prevent recording during undo
  isRedoing: boolean; // Flag to prevent recording during redo
}

interface HistoryActions {
  // Core undo/redo
  undo: () => void;
  redo: () => void;

  // Command management
  recordCommand: (command: Command) => void;
  clearHistory: () => void;

  // Query methods
  canUndo: () => boolean;
  canRedo: () => boolean;
  getUndoDescription: () => string | null;
  getRedoDescription: () => string | null;

  // Internal flags
  setUndoing: (value: boolean) => void;
  setRedoing: (value: boolean) => void;
}

type HistoryStore = HistoryState & HistoryActions;

const MAX_STACK_SIZE = 100; // Limit to prevent memory issues

// Command types that don't modify persisted data (clipboard snapshots, selection state)
const NON_DATA_COMMANDS = new Set([
  "copyRows",
  "cutRows",
  "copyCell",
  "cutCell",
  "toggleTaskSelection",
  "selectTaskRange",
  "clearSelection",
]);

export const useHistoryStore = create<HistoryStore>()(
  immer((set, get) => ({
    // State
    undoStack: [],
    redoStack: [],
    maxStackSize: MAX_STACK_SIZE,
    isUndoing: false,
    isRedoing: false,

    // Actions
    recordCommand: (command): void => {
      set((state) => {
        // Don't record if we're currently undoing/redoing
        if (state.isUndoing || state.isRedoing) return;

        // Add to undo stack
        state.undoStack.push(command);

        // Clear redo stack (branching: new action after undo)
        state.redoStack = [];

        // Trim undo stack if too large
        if (state.undoStack.length > state.maxStackSize) {
          state.undoStack.shift(); // Remove oldest
        }
      });
    },

    undo: (): void => {
      const { undoStack } = get();
      if (undoStack.length === 0) {
        // Show toast: nothing to undo
        toast("Nothing to undo", { icon: "ℹ️" });
        return;
      }

      // Get the command to undo
      const command = undoStack[undoStack.length - 1];

      set((state) => {
        state.isUndoing = true;
      });

      try {
        // Execute reverse action (imported dynamically to avoid circular deps)
        executeUndoCommand(command);

        set((state) => {
          // Move to redo stack
          const cmd = state.undoStack.pop();
          if (cmd) {
            state.redoStack.push(cmd);
          }
        });

        // Mark file dirty for data-modifying operations
        if (!NON_DATA_COMMANDS.has(command.type)) {
          useFileStore.getState().markDirty();
        }

        // Show toast notification
        toast.success(`↶ ${command.description}`);
      } catch (error) {
        console.error("Undo failed:", error);
        toast.error("Undo failed. Please refresh the page if issues persist.");
      } finally {
        set((state) => {
          state.isUndoing = false;
        });
      }
    },

    redo: (): void => {
      const { redoStack } = get();
      if (redoStack.length === 0) {
        // Show toast: nothing to redo
        toast("Nothing to redo", { icon: "ℹ️" });
        return;
      }

      // Get the command to redo
      const command = redoStack[redoStack.length - 1];

      set((state) => {
        state.isRedoing = true;
      });

      try {
        // Execute forward action
        executeRedoCommand(command);

        set((state) => {
          // Move back to undo stack
          const cmd = state.redoStack.pop();
          if (cmd) {
            state.undoStack.push(cmd);
          }
        });

        // Mark file dirty for data-modifying operations
        if (!NON_DATA_COMMANDS.has(command.type)) {
          useFileStore.getState().markDirty();
        }

        // Show toast notification
        toast.success(`↷ ${command.description}`);
      } catch (error) {
        console.error("Redo failed:", error);
        toast.error("Redo failed. Please refresh the page if issues persist.");
      } finally {
        set((state) => {
          state.isRedoing = false;
        });
      }
    },

    clearHistory: (): void => {
      set((state) => {
        state.undoStack = [];
        state.redoStack = [];
      });
    },

    canUndo: (): boolean => get().undoStack.length > 0,
    canRedo: (): boolean => get().redoStack.length > 0,

    getUndoDescription: (): string | null => {
      const { undoStack } = get();
      return undoStack.length > 0
        ? undoStack[undoStack.length - 1].description
        : null;
    },

    getRedoDescription: (): string | null => {
      const { redoStack } = get();
      return redoStack.length > 0
        ? redoStack[redoStack.length - 1].description
        : null;
    },

    setUndoing: (value): void =>
      set((state) => {
        state.isUndoing = value;
      }),
    setRedoing: (value): void =>
      set((state) => {
        state.isRedoing = value;
      }),
  }))
);

/**
 * Execute the reverse of a command (undo)
 *
 * Uses `any` casts for legacy command params that predate typed params interfaces.
 * New command types (hideTasks, unhideTasks, groupTasks, etc.) use proper types.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
function executeUndoCommand(command: Command): void {
  const taskStore = useTaskStore.getState();

  switch (command.type) {
    case "addTask": {
      const params = command.params as AddTaskParams;
      if (params.generatedIds && params.generatedIds.length > 0) {
        // Batch undo: remove all generated tasks
        const idsToRemove = new Set(params.generatedIds);
        const currentTasks = useTaskStore.getState().tasks;
        const filtered = currentTasks.filter((t) => !idsToRemove.has(t.id));
        filtered.forEach((task, index) => {
          task.order = index;
        });
        useTaskStore.setState({ tasks: filtered });
      } else if (params.generatedId) {
        taskStore.deleteTask(params.generatedId, false);
      }
      break;
    }

    case "updateTask": {
      const params = command.params as UpdateTaskParams;
      taskStore.updateTask(params.id, params.previousValues);

      // Handle cascade updates (revert parent summary dates)
      if (params.cascadeUpdates) {
        params.cascadeUpdates.forEach((cascade: any) => {
          taskStore.updateTask(cascade.id, cascade.previousValues);
        });
      }
      break;
    }

    case "deleteTask": {
      const params = command.params as any;
      // Re-add all deleted tasks in one operation
      const currentTasks = useTaskStore.getState().tasks;
      const restoredTasks = [...currentTasks, ...params.deletedTasks];

      // Revert cascade updates (restore parent summary dates to pre-delete state)
      if (params.cascadeUpdates) {
        for (const cascade of params.cascadeUpdates) {
          const parentIndex = restoredTasks.findIndex(
            (t: any) => t.id === cascade.id
          );
          if (parentIndex !== -1) {
            restoredTasks[parentIndex] = {
              ...restoredTasks[parentIndex],
              ...cascade.previousValues,
            };
          }
        }
      }

      useTaskStore.setState({ tasks: restoredTasks });
      break;
    }

    case "moveTaskToParent": {
      const params = command.params as any;
      taskStore.moveTaskToParent(
        params.taskId,
        params.previousParentId ?? null
      );
      break;
    }

    case "indentSelectedTasks": {
      const params = command.params as any;
      // Restore previous parent for each task
      params.changes.forEach((change: any) => {
        taskStore.moveTaskToParent(change.taskId, change.oldParent ?? null);
      });
      break;
    }

    case "outdentSelectedTasks": {
      const params = command.params as any;
      // Restore previous parent for each task
      params.changes.forEach((change: any) => {
        taskStore.moveTaskToParent(change.taskId, change.oldParent ?? null);
      });
      break;
    }

    case "convertToSummary": {
      const params = command.params as any;
      taskStore.convertToTask(params.taskId);
      break;
    }

    case "convertToTask": {
      const params = command.params as any;
      taskStore.convertToSummary(params.taskId);
      break;
    }

    case "toggleTaskSelection": {
      const params = command.params as any;
      // Restore previous selection
      useTaskStore.setState({
        selectedTaskIds: params.previousSelection,
      });
      break;
    }

    case "clearSelection": {
      const params = command.params as any;
      // Restore previous selection
      useTaskStore.setState({
        selectedTaskIds: params.previousSelection,
      });
      break;
    }

    case "reorderTasks": {
      const params = command.params as any;
      // Restore previous order
      useTaskStore.setState({
        tasks: params.previousOrder,
      });
      break;
    }

    case "toggleTaskCollapsed": {
      const params = command.params as any;
      if (params.taskId) {
        taskStore.toggleTaskCollapsed(params.taskId);
      }
      break;
    }

    // Dependency operations (Sprint 1.4)
    case "addDependency": {
      const params = command.params as AddDependencyParams;
      const depStore = useDependencyStore.getState();

      // Remove the dependency
      depStore.removeDependency(params.dependency.id);

      // Revert date adjustments
      if (params.dateAdjustments) {
        for (const adj of params.dateAdjustments) {
          taskStore.updateTask(adj.taskId, {
            startDate: adj.oldStartDate,
            endDate: adj.oldEndDate,
          });
        }
      }
      break;
    }

    case "deleteDependency": {
      const params = command.params as DeleteDependencyParams;
      const depStore = useDependencyStore.getState();

      // Re-add the dependency (without recording to history)
      const deps = depStore.dependencies;
      useDependencyStore.setState({
        dependencies: [...deps, params.dependency],
      });
      break;
    }

    case "updateDependency": {
      const params = command.params as UpdateDependencyParams;
      const depStore = useDependencyStore.getState();
      const deps = depStore.dependencies.map((d) =>
        d.id === params.id ? { ...d, ...params.previousValues } : d
      );
      useDependencyStore.setState({ dependencies: deps });
      break;
    }

    // Clipboard operations
    case "copyRows":
    case "cutRows":
    case "copyCell":
    case "cutCell": {
      // Copy/cut operations don't modify state, only record for consistency
      // Nothing to undo
      break;
    }

    case "pasteRows": {
      const params = command.params as PasteRowsParams;
      const depStore = useDependencyStore.getState();

      // Remove pasted tasks (deep clone to avoid Immer frozen objects)
      const currentTasks = useTaskStore.getState().tasks;
      const pastedTaskIds = new Set(params.pastedTasks.map((t) => t.id));
      let tasksWithoutPasted = currentTasks
        .filter((t) => !pastedTaskIds.has(t.id))
        .map((t) => ({ ...t }));

      // If this was a cut operation, restore deleted tasks
      if (params.deletedTasks && params.deletedTasks.length > 0) {
        tasksWithoutPasted = [
          ...tasksWithoutPasted,
          ...params.deletedTasks.map((t) => ({ ...t })),
        ];
      }

      // Update order property for all tasks
      tasksWithoutPasted.forEach((task, index) => {
        task.order = index;
      });

      useTaskStore.setState({ tasks: tasksWithoutPasted });

      // Remove pasted dependencies
      const pastedDepIds = new Set(params.pastedDependencies.map((d) => d.id));
      const depsWithoutPasted = depStore.dependencies.filter(
        (d) => !pastedDepIds.has(d.id)
      );
      useDependencyStore.setState({ dependencies: depsWithoutPasted });

      break;
    }

    case "pasteCell": {
      const params = command.params as PasteCellParams;

      // Restore previous value
      taskStore.updateTask(params.taskId, {
        [params.field]: params.previousValue,
      });

      // If this was a cut operation, restore source cell
      if (params.previousCutCell) {
        taskStore.updateTask(params.previousCutCell.taskId, {
          [params.previousCutCell.field]: params.previousCutCell.value,
        });
      }

      break;
    }

    case "multiDragTasks": {
      const params = command.params as MultiDragTasksParams;

      // Revert all task changes to previous values
      params.taskChanges.forEach((change) => {
        taskStore.updateTask(change.id, {
          startDate: change.previousStartDate,
          endDate: change.previousEndDate,
          duration: calculateDuration(
            change.previousStartDate,
            change.previousEndDate
          ),
        });
      });

      // Revert cascade updates (summary parent dates)
      params.cascadeUpdates.forEach((cascade) => {
        taskStore.updateTask(cascade.id, cascade.previousValues);
      });

      break;
    }

    case "applyColorsToManual": {
      const params = command.params as ApplyColorsToManualParams;

      // Restore previous color mode
      useChartStore.getState().setColorModeState(params.previousColorModeState);

      // Restore all task colors
      params.colorChanges.forEach((change) => {
        taskStore.updateTask(change.id, {
          color: change.previousColor,
          colorOverride: change.previousColorOverride,
        });
      });
      break;
    }

    case "groupTasks": {
      const params = command.params as GroupTasksParams;

      // Deep clone to avoid Immer frozen objects, then remove summary
      const currentTasks = useTaskStore
        .getState()
        .tasks.filter((t) => t.id !== params.summaryTaskId)
        .map((t) => ({ ...t }));

      // Restore each child's old parent
      for (const change of params.changes) {
        const task = currentTasks.find((t) => t.id === change.taskId);
        if (task) {
          task.parent = change.oldParent;
        }
      }

      // Restore previous order
      for (const orderEntry of params.previousOrder) {
        const task = currentTasks.find((t) => t.id === orderEntry.id);
        if (task) {
          task.order = orderEntry.order;
        }
      }

      // Revert cascade updates
      for (const cascade of params.cascadeUpdates) {
        const task = currentTasks.find((t) => t.id === cascade.id);
        if (task) {
          Object.assign(task, cascade.previousValues);
        }
      }

      useTaskStore.setState({ tasks: currentTasks });
      break;
    }

    case "ungroupTasks": {
      const params = command.params as UngroupTasksParams;

      // Re-add all deleted summaries and restore children's parents
      const currentTasks = useTaskStore.getState().tasks.map((t) => ({ ...t }));

      for (const entry of params.ungroupedSummaries) {
        // Re-add the summary task
        currentTasks.push({ ...entry.summaryTask });

        // Restore children's parent to the summary
        for (const change of entry.childChanges) {
          const task = currentTasks.find((t) => t.id === change.taskId);
          if (task) {
            task.parent = change.oldParent;
          }
        }

        // Restore removed dependencies
        if (entry.removedDependencies.length > 0) {
          const depStore = useDependencyStore.getState();
          const deps = [...depStore.dependencies, ...entry.removedDependencies];
          useDependencyStore.setState({ dependencies: deps });
        }
      }

      // Restore previous order
      for (const orderEntry of params.previousOrder) {
        const task = currentTasks.find((t) => t.id === orderEntry.id);
        if (task) {
          task.order = orderEntry.order;
        }
      }

      // Revert cascade updates
      for (const cascade of params.cascadeUpdates) {
        const task = currentTasks.find((t) => t.id === cascade.id);
        if (task) {
          Object.assign(task, cascade.previousValues);
        }
      }

      useTaskStore.setState({ tasks: currentTasks });
      break;
    }

    case "hideTasks": {
      const params = command.params as HideTasksParams;
      useChartStore.getState().setHiddenTaskIds(params.previousHiddenTaskIds);
      break;
    }

    case "unhideTasks": {
      const params = command.params as UnhideTasksParams;
      useChartStore.getState().setHiddenTaskIds(params.previousHiddenTaskIds);
      break;
    }

    default:
      console.warn("Unknown command type for undo:", command.type);
  }
}

/**
 * Execute a command forward (redo)
 */
function executeRedoCommand(command: Command): void {
  const taskStore = useTaskStore.getState();

  switch (command.type) {
    case "addTask": {
      const params = command.params as any;
      if (
        params.tasks &&
        params.generatedIds &&
        params.generatedIds.length > 0
      ) {
        // Batch redo: re-add all tasks at their original positions
        const state = useTaskStore.getState();
        const newTasks = params.tasks.map((t: any, i: number) => ({
          ...t,
          id: params.generatedIds[i],
        }));
        const allTasks = [...state.tasks, ...newTasks];
        allTasks.sort((a: any, b: any) => a.order - b.order);
        allTasks.forEach((task: any, index: number) => {
          task.order = index;
        });
        useTaskStore.setState({ tasks: allTasks });
      } else {
        const taskWithId = { ...params.task, id: params.generatedId };
        // Use internal method to avoid recording
        const state = useTaskStore.getState();
        useTaskStore.setState({
          tasks: [...state.tasks, taskWithId],
        });
      }
      break;
    }

    case "updateTask": {
      const params = command.params as any;
      taskStore.updateTask(params.id, params.updates);

      // Handle cascade updates (reapply parent summary dates)
      if (params.cascadeUpdates) {
        params.cascadeUpdates.forEach((cascade: any) => {
          taskStore.updateTask(cascade.id, cascade.updates);
        });
      }
      break;
    }

    case "deleteTask": {
      const params = command.params as any;
      // Use deletedIds to delete ALL tasks (fixes multi-task deletion redo)
      const idsToDelete = new Set(params.deletedIds || [params.id]);

      // Collect parent IDs of deleted tasks that aren't themselves deleted
      const affectedParentIds = new Set<string>();
      if (params.deletedTasks) {
        for (const task of params.deletedTasks) {
          if (task.parent && !idsToDelete.has(task.parent)) {
            affectedParentIds.add(task.parent);
          }
        }
      }

      const currentTasks = useTaskStore
        .getState()
        .tasks.filter((t) => !idsToDelete.has(t.id));

      // Recalculate affected parent summaries
      if (affectedParentIds.size > 0) {
        recalculateSummaryAncestors(currentTasks, affectedParentIds);
      }

      useTaskStore.setState({ tasks: currentTasks });
      break;
    }

    case "moveTaskToParent": {
      const params = command.params as any;
      taskStore.moveTaskToParent(params.taskId, params.newParentId);
      break;
    }

    case "indentSelectedTasks": {
      const params = command.params as any;
      // Restore new parent for each task
      params.changes.forEach((change: any) => {
        taskStore.moveTaskToParent(change.taskId, change.newParent ?? null);
      });
      break;
    }

    case "outdentSelectedTasks": {
      const params = command.params as any;
      // Restore new parent for each task
      params.changes.forEach((change: any) => {
        taskStore.moveTaskToParent(change.taskId, change.newParent ?? null);
      });
      break;
    }

    case "convertToSummary": {
      const params = command.params as any;
      taskStore.convertToSummary(params.taskId);
      break;
    }

    case "convertToTask": {
      const params = command.params as any;
      taskStore.convertToTask(params.taskId);
      break;
    }

    case "toggleTaskSelection": {
      const params = command.params as any;
      // Toggle back to new selection
      useTaskStore.setState({
        selectedTaskIds: params.taskIds,
      });
      break;
    }

    case "clearSelection": {
      useTaskStore.setState({
        selectedTaskIds: [],
      });
      break;
    }

    case "reorderTasks": {
      const params = command.params as any;
      // Re-execute the reorder
      taskStore.reorderTasks(params.activeTaskId, params.overTaskId);
      break;
    }

    case "toggleTaskCollapsed": {
      const params = command.params as any;
      if (params.taskId) {
        taskStore.toggleTaskCollapsed(params.taskId);
      }
      break;
    }

    // Dependency operations (Sprint 1.4)
    case "addDependency": {
      const params = command.params as AddDependencyParams;
      const depStore = useDependencyStore.getState();

      // Re-add the dependency (without recording to history)
      const deps = depStore.dependencies;
      useDependencyStore.setState({
        dependencies: [...deps, params.dependency],
      });

      // Re-apply date adjustments
      if (params.dateAdjustments) {
        for (const adj of params.dateAdjustments) {
          taskStore.updateTask(adj.taskId, {
            startDate: adj.newStartDate,
            endDate: adj.newEndDate,
          });
        }
      }
      break;
    }

    case "deleteDependency": {
      const params = command.params as DeleteDependencyParams;
      const depStore = useDependencyStore.getState();

      // Remove the dependency again
      depStore.removeDependency(params.dependency.id);
      break;
    }

    case "updateDependency": {
      const params = command.params as UpdateDependencyParams;
      const depStore = useDependencyStore.getState();
      const deps = depStore.dependencies.map((d) =>
        d.id === params.id ? { ...d, ...params.updates } : d
      );
      useDependencyStore.setState({ dependencies: deps });
      break;
    }

    // Clipboard operations
    case "copyRows":
    case "cutRows":
    case "copyCell":
    case "cutCell": {
      // Copy/cut operations don't modify state, only record for consistency
      // Nothing to redo
      break;
    }

    case "pasteRows": {
      const params = command.params as PasteRowsParams;
      const depStore = useDependencyStore.getState();

      // Re-insert pasted tasks at the same position (deep clone to avoid Immer frozen objects)
      const currentTasks = useTaskStore.getState().tasks;
      let updatedTasks = [
        ...currentTasks.slice(0, params.insertIndex).map((t) => ({ ...t })),
        ...params.pastedTasks.map((t) => ({ ...t })),
        ...currentTasks.slice(params.insertIndex).map((t) => ({ ...t })),
      ];

      // If this was a cut operation, delete originals again
      if (params.deletedTasks && params.deletedTasks.length > 0) {
        const deletedTaskIds = new Set(params.deletedTasks.map((t) => t.id));
        updatedTasks = updatedTasks.filter((t) => !deletedTaskIds.has(t.id));

        // Remove their dependencies
        const depsWithoutDeleted = useDependencyStore
          .getState()
          .dependencies.filter(
            (d) =>
              !deletedTaskIds.has(d.fromTaskId) &&
              !deletedTaskIds.has(d.toTaskId)
          );
        useDependencyStore.setState({ dependencies: depsWithoutDeleted });
      }

      // Update order property for all tasks
      updatedTasks.forEach((task, index) => {
        task.order = index;
      });

      useTaskStore.setState({ tasks: updatedTasks });

      // Re-add pasted dependencies
      const updatedDeps = [
        ...depStore.dependencies,
        ...params.pastedDependencies,
      ];
      useDependencyStore.setState({ dependencies: updatedDeps });

      break;
    }

    case "pasteCell": {
      const params = command.params as PasteCellParams;

      // Re-apply new value
      taskStore.updateTask(params.taskId, {
        [params.field]: params.newValue,
      });

      // If this was a cut operation, clear source cell again
      if (params.previousCutCell) {
        const clearValue = params.newValue; // Use the value that was cut
        taskStore.updateTask(params.previousCutCell.taskId, {
          [params.previousCutCell.field]: clearValue,
        });
      }

      break;
    }

    case "multiDragTasks": {
      const params = command.params as MultiDragTasksParams;

      // Re-apply all task changes
      params.taskChanges.forEach((change) => {
        taskStore.updateTask(change.id, {
          startDate: change.newStartDate,
          endDate: change.newEndDate,
          duration: calculateDuration(change.newStartDate, change.newEndDate),
        });
      });

      // Re-apply cascade updates (summary parent dates)
      params.cascadeUpdates.forEach((cascade) => {
        taskStore.updateTask(cascade.id, cascade.updates);
      });

      break;
    }

    case "applyColorsToManual": {
      const params = command.params as ApplyColorsToManualParams;

      // Re-apply computed colors and switch to manual
      params.colorChanges.forEach((change) => {
        taskStore.updateTask(change.id, {
          color: change.newColor,
          colorOverride: undefined,
        });
      });
      useChartStore.getState().setColorMode("manual");
      break;
    }

    case "groupTasks": {
      const params = command.params as GroupTasksParams;

      // Re-add the summary task and reparent children
      const currentTasks = useTaskStore.getState().tasks.map((t) => ({ ...t }));
      currentTasks.push({ ...params.summaryTask });

      // Reparent children under summary
      for (const change of params.changes) {
        const task = currentTasks.find((t) => t.id === change.taskId);
        if (task) {
          task.parent = params.summaryTaskId;
        }
      }

      // Normalize order and recalculate summaries
      normalizeTaskOrder(currentTasks);
      const affectedParents = new Set<string>([params.summaryTaskId]);
      if (params.summaryTask.parent)
        affectedParents.add(params.summaryTask.parent);
      recalculateSummaryAncestors(currentTasks, affectedParents);

      useTaskStore.setState({ tasks: currentTasks });
      break;
    }

    case "ungroupTasks": {
      const params = command.params as UngroupTasksParams;

      // Re-apply ungroup: remove summaries, reparent children
      const currentTasks = useTaskStore.getState().tasks.map((t) => ({ ...t }));
      const summaryIds = new Set(
        params.ungroupedSummaries.map((e) => e.summaryTask.id)
      );

      for (const entry of params.ungroupedSummaries) {
        // Reparent children to summary's parent
        for (const change of entry.childChanges) {
          const task = currentTasks.find((t) => t.id === change.taskId);
          if (task) {
            task.parent = entry.summaryTask.parent;
          }
        }

        // Remove dependencies for this summary
        if (entry.removedDependencies.length > 0) {
          const depIds = new Set(entry.removedDependencies.map((d) => d.id));
          const depStore = useDependencyStore.getState();
          useDependencyStore.setState({
            dependencies: depStore.dependencies.filter(
              (d) => !depIds.has(d.id)
            ),
          });
        }
      }

      // Remove summaries
      const filteredTasks = currentTasks.filter((t) => !summaryIds.has(t.id));

      normalizeTaskOrder(filteredTasks);

      // Recalculate affected ancestors
      const affectedParents = new Set<string>();
      for (const entry of params.ungroupedSummaries) {
        if (entry.summaryTask.parent)
          affectedParents.add(entry.summaryTask.parent);
      }
      recalculateSummaryAncestors(filteredTasks, affectedParents);

      useTaskStore.setState({ tasks: filteredTasks });
      break;
    }

    case "hideTasks": {
      const params = command.params as HideTasksParams;
      // Re-apply hiding: set to the state after hiding (previous + newly hidden)
      const newHidden = [
        ...new Set([...params.previousHiddenTaskIds, ...params.taskIds]),
      ];
      useChartStore.getState().setHiddenTaskIds(newHidden);
      break;
    }

    case "unhideTasks": {
      const params = command.params as UnhideTasksParams;
      // Re-apply unhiding: remove the unhidden IDs from previous state
      const idsToUnhide = new Set(params.taskIds);
      const newHidden = params.previousHiddenTaskIds.filter(
        (id) => !idsToUnhide.has(id)
      );
      useChartStore.getState().setHiddenTaskIds(newHidden);
      break;
    }

    default:
      console.warn("Unknown command type for redo:", command.type);
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
