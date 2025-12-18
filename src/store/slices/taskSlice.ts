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
 * Task store hook with immer middleware for immutable updates.
 */
export const useTaskStore = create<TaskState>()(
  immer(() => ({
    tasks: [] as Task[],
    selectedTaskId: null as string | null,
  }))
);
