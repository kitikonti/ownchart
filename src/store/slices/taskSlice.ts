/**
 * Task slice for Zustand store.
 * Manages task state and provides CRUD operations.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Task } from '../../types/chart.types';

/**
 * Editable field types for cell-based editing.
 */
export type EditableField = 'name' | 'startDate' | 'endDate' | 'duration' | 'progress' | 'color';

/**
 * Cell navigation direction.
 */
export type NavigationDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Task state interface.
 */
interface TaskState {
  tasks: Task[];
  selectedTaskId: string | null;

  // Multi-selection state
  selectedTaskIds: string[];
  lastSelectedTaskId: string | null;

  // Cell navigation state
  activeCell: {
    taskId: string | null;
    field: EditableField | null;
  };
  isEditingCell: boolean;
  columnWidths: Record<string, number>;
}

/**
 * Task actions interface.
 */
interface TaskActions {
  addTask: (taskData: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  selectTask: (id: string | null) => void;
  reorderTasks: (fromIndex: number, toIndex: number) => void;

  // Multi-selection actions
  toggleTaskSelection: (id: string) => void;
  selectTaskRange: (startId: string, endId: string) => void;
  selectAllTasks: () => void;
  clearSelection: () => void;

  // Cell navigation actions
  setActiveCell: (taskId: string | null, field: EditableField | null) => void;
  navigateCell: (direction: NavigationDirection) => void;
  startCellEdit: () => void;
  stopCellEdit: () => void;
  setColumnWidth: (columnId: string, width: number) => void;
}

/**
 * Combined store interface.
 */
type TaskStore = TaskState & TaskActions;

/**
 * Task store hook with immer middleware for immutable updates.
 */
/**
 * Editable fields in order of tab navigation.
 */
const EDITABLE_FIELDS: EditableField[] = ['name', 'startDate', 'endDate', 'duration', 'progress', 'color'];

export const useTaskStore = create<TaskStore>()(
  immer((set) => ({
    // State
    tasks: [] as Task[],
    selectedTaskId: null as string | null,
    selectedTaskIds: [] as string[],
    lastSelectedTaskId: null as string | null,
    activeCell: {
      taskId: null as string | null,
      field: null as EditableField | null,
    },
    isEditingCell: false,
    columnWidths: {} as Record<string, number>,

    // Actions
    addTask: (taskData) =>
      set((state) => {
        const newTask: Task = {
          ...taskData,
          id: crypto.randomUUID(),
        };
        state.tasks.push(newTask);
      }),

    updateTask: (id, updates) =>
      set((state) => {
        const taskIndex = state.tasks.findIndex((task) => task.id === id);
        if (taskIndex !== -1) {
          state.tasks[taskIndex] = {
            ...state.tasks[taskIndex],
            ...updates,
          };
        }
      }),

    deleteTask: (id) =>
      set((state) => {
        state.tasks = state.tasks.filter((task) => task.id !== id);
      }),

    selectTask: (id) =>
      set((state) => {
        state.selectedTaskId = id;
      }),

    reorderTasks: (fromIndex, toIndex) =>
      set((state) => {
        if (
          fromIndex < 0 ||
          fromIndex >= state.tasks.length ||
          toIndex < 0 ||
          toIndex >= state.tasks.length
        ) {
          return;
        }

        const [movedTask] = state.tasks.splice(fromIndex, 1);
        state.tasks.splice(toIndex, 0, movedTask);

        // Update order property for all tasks
        state.tasks.forEach((task, index) => {
          task.order = index;
        });
      }),

    // Multi-selection actions
    toggleTaskSelection: (id) =>
      set((state) => {
        const index = state.selectedTaskIds.indexOf(id);
        if (index > -1) {
          state.selectedTaskIds.splice(index, 1);
        } else {
          state.selectedTaskIds.push(id);
        }
        state.lastSelectedTaskId = id;
      }),

    selectTaskRange: (startId, endId) =>
      set((state) => {
        const startIndex = state.tasks.findIndex((t) => t.id === startId);
        const endIndex = state.tasks.findIndex((t) => t.id === endId);

        if (startIndex === -1 || endIndex === -1) return;

        const minIndex = Math.min(startIndex, endIndex);
        const maxIndex = Math.max(startIndex, endIndex);

        const idsToAdd = new Set(state.selectedTaskIds);
        for (let i = minIndex; i <= maxIndex; i++) {
          idsToAdd.add(state.tasks[i].id);
        }
        state.selectedTaskIds = Array.from(idsToAdd);
        state.lastSelectedTaskId = endId;
      }),

    selectAllTasks: () =>
      set((state) => {
        state.selectedTaskIds = state.tasks.map((task) => task.id);
      }),

    clearSelection: () =>
      set((state) => {
        state.selectedTaskIds = [];
        state.lastSelectedTaskId = null;
      }),

    // Cell navigation actions
    setActiveCell: (taskId, field) =>
      set((state) => {
        state.activeCell.taskId = taskId;
        state.activeCell.field = field;
        state.isEditingCell = false;
      }),

    navigateCell: (direction) =>
      set((state) => {
        const { activeCell, tasks } = state;
        if (!activeCell.taskId || !activeCell.field) return;

        const taskIndex = tasks.findIndex((t) => t.id === activeCell.taskId);
        if (taskIndex === -1) return;

        const fieldIndex = EDITABLE_FIELDS.indexOf(activeCell.field);
        if (fieldIndex === -1) return;

        let newTaskIndex = taskIndex;
        let newFieldIndex = fieldIndex;

        switch (direction) {
          case 'up':
            newTaskIndex = Math.max(0, taskIndex - 1);
            break;
          case 'down':
            newTaskIndex = Math.min(tasks.length - 1, taskIndex + 1);
            break;
          case 'left':
            newFieldIndex = Math.max(0, fieldIndex - 1);
            break;
          case 'right':
            newFieldIndex = Math.min(EDITABLE_FIELDS.length - 1, fieldIndex + 1);
            break;
        }

        const newTaskId = tasks[newTaskIndex]?.id || null;
        const newField = EDITABLE_FIELDS[newFieldIndex];

        state.activeCell.taskId = newTaskId;
        state.activeCell.field = newField;
        state.isEditingCell = false;
      }),

    startCellEdit: () =>
      set((state) => {
        state.isEditingCell = true;
      }),

    stopCellEdit: () =>
      set((state) => {
        state.isEditingCell = false;
      }),

    setColumnWidth: (columnId, width) =>
      set((state) => {
        state.columnWidths[columnId] = width;
      }),
  }))
);
