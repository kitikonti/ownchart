/**
 * Expansion actions extracted from taskSlice.
 * Handles collapse/expand of summary tasks.
 */

import { useFileStore } from "./fileSlice";
import type {
  TaskSliceSet,
  TaskSliceGet,
  TaskActions,
  TaskState,
} from "./taskSlice";

type ExpansionActions = Pick<
  TaskActions,
  "toggleTaskCollapsed" | "expandTask" | "collapseTask" | "expandAll" | "collapseAll"
>;

/**
 * Set a single task's open state. Returns true if state changed.
 */
function setTaskOpen(state: TaskState, taskId: string, open: boolean): boolean {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task || task.type !== "summary") return false;
  const hasChildren = state.tasks.some((t) => t.parent === taskId);
  if (!hasChildren) return false;
  const currentOpen = task.open ?? true;
  if (currentOpen === open) return false;
  task.open = open;
  return true;
}

/**
 * Set all summary tasks to open or closed. Returns true if any changed.
 */
function setAllTasksOpen(state: TaskState, open: boolean): boolean {
  let changed = false;
  state.tasks.forEach((task) => {
    if (task.type !== "summary") return;
    const hasChildren = state.tasks.some((t) => t.parent === task.id);
    if (!hasChildren) return;
    const currentOpen = task.open ?? true;
    if (currentOpen !== open) {
      task.open = open;
      changed = true;
    }
  });
  return changed;
}

export function createExpansionActions(
  set: TaskSliceSet,
  _get: TaskSliceGet
): ExpansionActions {
  return {
    toggleTaskCollapsed: (taskId): void => {
      let changed = false;
      set((state) => {
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task || task.type !== "summary") return;
        const hasChildren = state.tasks.some((t) => t.parent === taskId);
        if (!hasChildren) return;
        task.open = !(task.open ?? true);
        changed = true;
      });
      if (changed) useFileStore.getState().markDirty();
    },

    expandTask: (taskId): void => {
      let changed = false;
      set((state) => {
        changed = setTaskOpen(state, taskId, true);
      });
      if (changed) useFileStore.getState().markDirty();
    },

    collapseTask: (taskId): void => {
      let changed = false;
      set((state) => {
        changed = setTaskOpen(state, taskId, false);
      });
      if (changed) useFileStore.getState().markDirty();
    },

    expandAll: (): void => {
      let changed = false;
      set((state) => {
        changed = setAllTasksOpen(state, true);
      });
      if (changed) useFileStore.getState().markDirty();
    },

    collapseAll: (): void => {
      let changed = false;
      set((state) => {
        changed = setAllTasksOpen(state, false);
      });
      if (changed) useFileStore.getState().markDirty();
    },
  };
}
