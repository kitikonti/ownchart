/**
 * Insertion actions extracted from taskSlice.
 * Handles inserting tasks above/below a reference task.
 */

import type { Task } from "@/types/chart.types";
import { type TaskId, toTaskId } from "@/types/branded.types";
import {
  recalculateSummaryAncestors,
  normalizeTaskOrder,
} from "@/utils/hierarchy";
import { toISODateString } from "@/utils/dateUtils";
import { useFileStore } from "./fileSlice";
import { useChartStore } from "./chartSlice";
import { CommandType } from "@/types/command.types";
import { COLORS } from "@/styles/design-tokens";
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

/**
 * Fractional offset applied to refTask.order when computing pre-normalization
 * order values for newly inserted tasks. Must satisfy:
 *   count × INSERTION_ORDER_STEP < 1.0
 * so that inserted tasks stay within the gap between two consecutive integer
 * orders produced by normalizeTaskOrder. The practical maximum count
 * (inserting all tasks at once via Ctrl++) is well below 1 / INSERTION_ORDER_STEP.
 */
const INSERTION_ORDER_STEP = 0.001;

/**
 * Compute start/end dates for an inserted task relative to a reference task.
 */
function computeInsertionDates(
  refTask: Task,
  direction: "above" | "below",
  offset: number
): { startDate: string; endDate: string } {
  if (direction === "above") {
    if (refTask.startDate) {
      const refStart = new Date(refTask.startDate);
      const end = new Date(refStart);
      end.setDate(
        refStart.getDate() - 1 - offset * (DEFAULT_TASK_DURATION + 1)
      );
      const start = new Date(end);
      start.setDate(end.getDate() - DEFAULT_TASK_DURATION + 1);
      return {
        startDate: toISODateString(start),
        endDate: toISODateString(end),
      };
    }
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - DEFAULT_TASK_DURATION + 1);
    return {
      startDate: toISODateString(weekAgo),
      endDate: toISODateString(today),
    };
  }

  // direction === "below"
  if (refTask.endDate) {
    const refEnd = new Date(refTask.endDate);
    const start = new Date(refEnd);
    start.setDate(refEnd.getDate() + 1 + offset * (DEFAULT_TASK_DURATION + 1));
    const end = new Date(start);
    end.setDate(start.getDate() + DEFAULT_TASK_DURATION - 1);
    return { startDate: toISODateString(start), endDate: toISODateString(end) };
  }
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + DEFAULT_TASK_DURATION - 1);
  return {
    startDate: toISODateString(today),
    endDate: toISODateString(nextWeek),
  };
}

/** Insert tasks above or below a reference task. */
function insertTasksRelative(
  set: TaskSliceSet,
  get: TaskSliceGet,
  referenceTaskId: string,
  direction: "above" | "below",
  count = 1
): void {
  const state = get();
  const refTask = state.tasks.find((t) => t.id === referenceTaskId);
  if (!refTask || count < 1) return;
  const refOrder = refTask.order;

  const tasksToInsert: Array<Omit<Task, "id">> = [];
  const generatedIds: TaskId[] = [];

  for (let i = 0; i < count; i++) {
    const { startDate, endDate } = computeInsertionDates(refTask, direction, i);

    // Use fractional order relative to refTask so normalizeTaskOrder
    // places new tasks correctly regardless of array position.
    const fractionalOrder =
      direction === "below"
        ? refOrder + INSERTION_ORDER_STEP * (i + 1)
        : refOrder - INSERTION_ORDER_STEP * (i + 1);

    tasksToInsert.push({
      name: DEFAULT_TASK_NAME,
      startDate,
      endDate,
      duration: DEFAULT_TASK_DURATION,
      progress: 0,
      color: COLORS.chart.taskDefault,
      order: fractionalOrder,
      type: "task",
      parent: refTask.parent,
      metadata: {},
    });
    generatedIds.push(toTaskId(crypto.randomUUID()));
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

    state.tasks.push(...newTasks);
    normalizeTaskOrder(state.tasks);

    if (refTask.parent) {
      recalculateSummaryAncestors(state.tasks, new Set([refTask.parent]));
    }
  });

  useFileStore.getState().markDirty();

  // Ensure the newly inserted task is visible in the timeline
  useChartStore.getState().requestScrollToDate(tasksToInsert[0].startDate);

  // Read back final order values so recordCommand captures correct state
  const finalState = get();
  for (let i = 0; i < tasksToInsert.length; i++) {
    const finalTask = finalState.tasks.find((t) => t.id === generatedIds[i]);
    if (finalTask) {
      tasksToInsert[i].order = finalTask.order;
    }
  }

  const description =
    count === 1
      ? `Inserted task ${direction}`
      : `Inserted ${count} tasks ${direction}`;

  if (count === 1) {
    recordCommand(CommandType.ADD_TASK, description, {
      mode: "single",
      task: tasksToInsert[0],
      generatedId: generatedIds[0],
    });
  } else {
    recordCommand(CommandType.ADD_TASK, description, {
      mode: "batch",
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
