/**
 * History slice for undo/redo functionality
 * Manages command stacks and provides undo/redo operations
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import toast from 'react-hot-toast';
import type { Command, AddTaskParams, UpdateTaskParams } from '../../types/command.types';
import { useTaskStore } from './taskSlice';

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

export const useHistoryStore = create<HistoryStore>()(
  immer((set, get) => ({
    // State
    undoStack: [],
    redoStack: [],
    maxStackSize: MAX_STACK_SIZE,
    isUndoing: false,
    isRedoing: false,

    // Actions
    recordCommand: (command) => {
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

    undo: () => {
      const { undoStack } = get();
      if (undoStack.length === 0) {
        // Show toast: nothing to undo
        toast('Nothing to undo', { icon: 'ℹ️' });
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

        // Show toast notification
        toast.success(`↶ ${command.description}`);
      } catch (error) {
        console.error('Undo failed:', error);
        toast.error('Undo failed. Please refresh the page if issues persist.');
      } finally {
        set((state) => {
          state.isUndoing = false;
        });
      }
    },

    redo: () => {
      const { redoStack } = get();
      if (redoStack.length === 0) {
        // Show toast: nothing to redo
        toast('Nothing to redo', { icon: 'ℹ️' });
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

        // Show toast notification
        toast.success(`↷ ${command.description}`);
      } catch (error) {
        console.error('Redo failed:', error);
        toast.error('Redo failed. Please refresh the page if issues persist.');
      } finally {
        set((state) => {
          state.isRedoing = false;
        });
      }
    },

    clearHistory: () => {
      set((state) => {
        state.undoStack = [];
        state.redoStack = [];
      });
    },

    canUndo: () => get().undoStack.length > 0,
    canRedo: () => get().redoStack.length > 0,

    getUndoDescription: () => {
      const { undoStack } = get();
      return undoStack.length > 0
        ? undoStack[undoStack.length - 1].description
        : null;
    },

    getRedoDescription: () => {
      const { redoStack } = get();
      return redoStack.length > 0
        ? redoStack[redoStack.length - 1].description
        : null;
    },

    setUndoing: (value) =>
      set((state) => {
        state.isUndoing = value;
      }),
    setRedoing: (value) =>
      set((state) => {
        state.isRedoing = value;
      }),
  }))
);

/**
 * Execute the reverse of a command (undo)
 */
function executeUndoCommand(command: Command): void {
  const taskStore = useTaskStore.getState();

  switch (command.type) {
    case 'addTask': {
      const params = command.params as AddTaskParams;
      if (params.generatedId) {
        taskStore.deleteTask(params.generatedId, false);
      }
      break;
    }

    case 'updateTask': {
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

    case 'deleteTask': {
      const params = command.params as any;
      // Re-add all deleted tasks in one operation
      const currentTasks = useTaskStore.getState().tasks;
      useTaskStore.setState({
        tasks: [...currentTasks, ...params.deletedTasks],
      });
      break;
    }

    case 'moveTaskToParent': {
      const params = command.params as any;
      taskStore.moveTaskToParent(params.taskId, params.previousParentId ?? null);
      break;
    }

    case 'indentSelectedTasks': {
      const params = command.params as any;
      // Restore previous parent for each task
      params.changes.forEach((change: any) => {
        taskStore.moveTaskToParent(change.taskId, change.oldParent ?? null);
      });
      break;
    }

    case 'outdentSelectedTasks': {
      const params = command.params as any;
      // Restore previous parent for each task
      params.changes.forEach((change: any) => {
        taskStore.moveTaskToParent(change.taskId, change.oldParent ?? null);
      });
      break;
    }

    case 'convertToSummary': {
      const params = command.params as any;
      taskStore.convertToTask(params.taskId);
      break;
    }

    case 'convertToTask': {
      const params = command.params as any;
      taskStore.convertToSummary(params.taskId);
      break;
    }

    case 'toggleTaskSelection': {
      const params = command.params as any;
      // Restore previous selection
      useTaskStore.setState({
        selectedTaskIds: params.previousSelection,
      });
      break;
    }

    case 'clearSelection': {
      const params = command.params as any;
      // Restore previous selection
      useTaskStore.setState({
        selectedTaskIds: params.previousSelection,
      });
      break;
    }

    case 'reorderTasks': {
      const params = command.params as any;
      // Restore previous order
      useTaskStore.setState({
        tasks: params.previousOrder,
      });
      break;
    }

    case 'toggleTaskCollapsed': {
      const params = command.params as any;
      if (params.taskId) {
        taskStore.toggleTaskCollapsed(params.taskId);
      }
      break;
    }

    default:
      console.warn('Unknown command type for undo:', command.type);
  }
}

/**
 * Execute a command forward (redo)
 */
function executeRedoCommand(command: Command): void {
  const taskStore = useTaskStore.getState();

  switch (command.type) {
    case 'addTask': {
      const params = command.params as any;
      const taskWithId = { ...params.task, id: params.generatedId };
      // Use internal method to avoid recording
      const state = useTaskStore.getState();
      useTaskStore.setState({
        tasks: [...state.tasks, taskWithId],
      });
      break;
    }

    case 'updateTask': {
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

    case 'deleteTask': {
      const params = command.params as any;
      taskStore.deleteTask(params.id, params.cascade);
      break;
    }

    case 'moveTaskToParent': {
      const params = command.params as any;
      taskStore.moveTaskToParent(params.taskId, params.newParentId);
      break;
    }

    case 'indentSelectedTasks': {
      const params = command.params as any;
      // Restore new parent for each task
      params.changes.forEach((change: any) => {
        taskStore.moveTaskToParent(change.taskId, change.newParent ?? null);
      });
      break;
    }

    case 'outdentSelectedTasks': {
      const params = command.params as any;
      // Restore new parent for each task
      params.changes.forEach((change: any) => {
        taskStore.moveTaskToParent(change.taskId, change.newParent ?? null);
      });
      break;
    }

    case 'convertToSummary': {
      const params = command.params as any;
      taskStore.convertToSummary(params.taskId);
      break;
    }

    case 'convertToTask': {
      const params = command.params as any;
      taskStore.convertToTask(params.taskId);
      break;
    }

    case 'toggleTaskSelection': {
      const params = command.params as any;
      // Toggle back to new selection
      useTaskStore.setState({
        selectedTaskIds: params.taskIds,
      });
      break;
    }

    case 'clearSelection': {
      useTaskStore.setState({
        selectedTaskIds: [],
      });
      break;
    }

    case 'reorderTasks': {
      const params = command.params as any;
      // Re-execute the reorder
      taskStore.reorderTasks(params.fromIndex, params.toIndex);
      break;
    }

    case 'toggleTaskCollapsed': {
      const params = command.params as any;
      if (params.taskId) {
        taskStore.toggleTaskCollapsed(params.taskId);
      }
      break;
    }

    default:
      console.warn('Unknown command type for redo:', command.type);
  }
}

