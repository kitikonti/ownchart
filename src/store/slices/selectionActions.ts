/**
 * Selection actions extracted from taskSlice.
 * Handles multi-select, range selection, and selection management.
 */

import { buildFlattenedTaskList } from "../../utils/hierarchy";
import type { TaskSliceSet, TaskActions } from "./taskSlice";

type SelectionActions = Pick<
  TaskActions,
  | "toggleTaskSelection"
  | "selectTaskRange"
  | "selectAllTasks"
  | "clearSelection"
  | "setSelectedTaskIds"
>;

export function createSelectionActions(set: TaskSliceSet): SelectionActions {
  return {
    toggleTaskSelection: (id): void =>
      set((state) => {
        const index = state.selectedTaskIds.indexOf(id);
        if (index > -1) {
          state.selectedTaskIds.splice(index, 1);
        } else {
          state.selectedTaskIds.push(id);
        }
        state.lastSelectedTaskId = id;
      }),

    selectTaskRange: (startId, endId): void =>
      set((state) => {
        const collapsedIds = new Set(
          state.tasks.filter((t) => t.open === false).map((t) => t.id)
        );
        const flatList = buildFlattenedTaskList(state.tasks, collapsedIds);
        const startIndex = flatList.findIndex((ft) => ft.task.id === startId);
        const endIndex = flatList.findIndex((ft) => ft.task.id === endId);

        if (startIndex === -1 || endIndex === -1) return;

        const minIndex = Math.min(startIndex, endIndex);
        const maxIndex = Math.max(startIndex, endIndex);

        const idsToAdd = new Set(state.selectedTaskIds);
        for (let i = minIndex; i <= maxIndex; i++) {
          idsToAdd.add(flatList[i].task.id);
        }
        state.selectedTaskIds = Array.from(idsToAdd);
        state.lastSelectedTaskId = endId;
      }),

    selectAllTasks: (): void =>
      set((state) => {
        state.selectedTaskIds = state.tasks.map((task) => task.id);
      }),

    clearSelection: (): void =>
      set((state) => {
        state.selectedTaskIds = [];
        state.lastSelectedTaskId = null;
      }),

    setSelectedTaskIds: (ids, addToSelection = false): void =>
      set((state) => {
        if (addToSelection) {
          const existingSet = new Set(state.selectedTaskIds);
          const newIds = ids.filter((id) => !existingSet.has(id));
          state.selectedTaskIds = [...state.selectedTaskIds, ...newIds];
        } else {
          state.selectedTaskIds = ids;
        }
        if (ids.length > 0) {
          state.lastSelectedTaskId = ids[ids.length - 1];
        }
      }),
  };
}
