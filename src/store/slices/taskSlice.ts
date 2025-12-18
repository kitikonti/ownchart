/**
 * Task slice for Zustand store.
 * Manages task state and provides CRUD operations.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Task } from '../../types/chart.types';

/**
 * Task state interface.
 */
interface TaskState {
  tasks: Task[];
  selectedTaskId: string | null;
}

/**
 * Task actions interface.
 */
interface TaskActions {
  addTask: (taskData: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
}

/**
 * Combined store interface.
 */
type TaskStore = TaskState & TaskActions;

/**
 * Task store hook with immer middleware for immutable updates.
 */
export const useTaskStore = create<TaskStore>()(
  immer((set) => ({
    // State
    tasks: [] as Task[],
    selectedTaskId: null as string | null,

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
  }))
);
