/**
 * Insertion actions extracted from taskSlice.
 * Handles inserting tasks above/below a reference task.
 */

import type { Task } from "../../types/chart.types";
import {
  recalculateSummaryAncestors,
  normalizeTaskOrder,
} from "../../utils/hierarchy";
import { useFileStore } from "./fileSlice";
import { CommandType } from "../../types/command.types";
import { COLORS } from "../../styles/design-tokens";
import {
  DEFAULT_TASK_DURATION,
  DEFAULT_TASK_NAME,
  recordCommand,
} from "./taskSliceHelpers";
import type { TaskSliceSet, TaskSliceGet, TaskActions } from "./taskSlice";

type InsertionActions = Pick<
  TaskActions,
  "insertTaskAbove" | "insertTaskBelow" | "insertMultipleTasksAbove"
>;

/** Insert tasks above or below a reference task. */
function insertTasksRelative(
  set: TaskSliceSet,
  get: TaskSliceGet,
  referenceTaskId: string,
  direction: "above" | "below",
  count = 1
): void {
  const state = get();
  const refIndex = state.tasks.findIndex((t) => t.id === referenceTaskId);
  if (refIndex === -1 || count < 1) return;

  const refTask = state.tasks[refIndex];
  const spliceIndex = direction === "above" ? refIndex : refIndex + 1;

  const tasksToInsert: Array<Omit<Task, "id">> = [];
  const generatedIds: string[] = [];

  for (let i = 0; i < count; i++) {
    let startDate = "";
    let endDate = "";

    if (direction === "above") {
      if (refTask.startDate) {
        const refStart = new Date(refTask.startDate);
        const end = new Date(refStart);
        end.setDate(
          refStart.getDate() - 1 - i * (DEFAULT_TASK_DURATION + 1)
        );
        endDate = end.toISOString().split("T")[0];
        const start = new Date(end);
        start.setDate(end.getDate() - DEFAULT_TASK_DURATION + 1);
        startDate = start.toISOString().split("T")[0];
      } else {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - DEFAULT_TASK_DURATION + 1);
        startDate = weekAgo.toISOString().split("T")[0];
        endDate = today.toISOString().split("T")[0];
      }
    } else {
      if (refTask.endDate) {
        const refEnd = new Date(refTask.endDate);
        const start = new Date(refEnd);
        start.setDate(
          refEnd.getDate() + 1 + i * (DEFAULT_TASK_DURATION + 1)
        );
        startDate = start.toISOString().split("T")[0];
        const end = new Date(start);
        end.setDate(start.getDate() + DEFAULT_TASK_DURATION - 1);
        endDate = end.toISOString().split("T")[0];
      } else {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + DEFAULT_TASK_DURATION - 1);
        startDate = today.toISOString().split("T")[0];
        endDate = nextWeek.toISOString().split("T")[0];
      }
    }

    tasksToInsert.push({
      name: DEFAULT_TASK_NAME,
      startDate,
      endDate,
      duration: DEFAULT_TASK_DURATION,
      progress: 0,
      color: COLORS.chart.taskDefault,
      order: spliceIndex + i,
      type: "task",
      parent: refTask.parent,
      metadata: {},
    });
    generatedIds.push(crypto.randomUUID());
  }

  // For "above" with multiple tasks: reverse so earliest comes first
  if (direction === "above" && count > 1) {
    tasksToInsert.reverse();
    generatedIds.reverse();
  }

  set((state) => {
    const newTasks: Task[] = tasksToInsert.map((taskData, i) => ({
      ...taskData,
      id: generatedIds[i],
    }));

    state.tasks.splice(spliceIndex, 0, ...newTasks);
    // Set sequential order so normalizeTaskOrder can sort correctly
    state.tasks.forEach((task, index) => {
      task.order = index;
    });
    normalizeTaskOrder(state.tasks);

    if (refTask.parent) {
      recalculateSummaryAncestors(state.tasks, new Set([refTask.parent]));
    }
  });

  useFileStore.getState().markDirty();

  const description =
    count === 1
      ? `Inserted task ${direction}`
      : `Inserted ${count} tasks ${direction}`;

  if (count === 1) {
    recordCommand(CommandType.ADD_TASK, description, {
      task: tasksToInsert[0],
      generatedId: generatedIds[0],
    });
  } else {
    recordCommand(CommandType.ADD_TASK, description, {
      task: tasksToInsert[0],
      tasks: tasksToInsert,
      generatedIds,
    });
  }
}

export function createInsertionActions(
  set: TaskSliceSet,
  get: TaskSliceGet
): InsertionActions {
  return {
    insertTaskAbove: (referenceTaskId): void =>
      insertTasksRelative(set, get, referenceTaskId, "above"),

    insertMultipleTasksAbove: (referenceTaskId, count): void =>
      insertTasksRelative(set, get, referenceTaskId, "above", count),

    insertTaskBelow: (referenceTaskId): void =>
      insertTasksRelative(set, get, referenceTaskId, "below"),
  };
}
