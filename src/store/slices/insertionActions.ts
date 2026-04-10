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
import { toISODateString, addDays, calculateDuration } from "@/utils/dateUtils";
import { useFileStore } from "./fileSlice";
import { useChartStore } from "./chartSlice";
import { CommandType } from "@/types/command.types";
import { COLORS } from "@/styles/design-tokens";
import {
  DEFAULT_TASK_DURATION,
  DEFAULT_TASK_NAME,
  recordCommand,
} from "./taskSliceHelpers";
import { getWorkingDaysContext } from "@/store/selectors/workingDaysContextSelector";
import {
  snapForwardToWorkingDay,
  snapBackwardToWorkingDay,
  addWorkingDays,
  subtractWorkingDays,
  type WorkingDaysContext,
} from "@/utils/workingDaysCalculator";
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
 * Compute start/end/duration for an inserted task relative to a reference task.
 *
 * Uses date-fns addDays throughout (not `new Date()` + `.setDate()`) to avoid
 * the UTC/local-time mismatch documented in useNewTaskCreation.ts.
 *
 * When working-days mode is active:
 * - Insert below: start snaps forward, end via addWorkingDays
 * - Insert above: end snaps backward, start via subtractWorkingDays
 *   (so the new task stays before the reference)
 *
 * Duration is always returned as calendar days (storage contract).
 */
export function computeInsertionDates(
  refTask: Task,
  direction: "above" | "below",
  offset: number,
  ctx?: WorkingDaysContext
): { startDate: string; endDate: string; duration: number } {
  if (direction === "above") {
    if (refTask.startDate) {
      let endDate = addDays(
        refTask.startDate,
        -1 - offset * (DEFAULT_TASK_DURATION + 1)
      );

      if (ctx?.enabled) {
        endDate = snapBackwardToWorkingDay(
          endDate,
          ctx.config,
          ctx.holidayRegion
        );
        const startDate = subtractWorkingDays(
          endDate,
          DEFAULT_TASK_DURATION,
          ctx.config,
          ctx.holidayRegion
        );
        return {
          startDate,
          endDate,
          duration: calculateDuration(startDate, endDate),
        };
      }

      const startDate = addDays(endDate, -(DEFAULT_TASK_DURATION - 1));
      return { startDate, endDate, duration: DEFAULT_TASK_DURATION };
    }
    // No reference start — fallback to today. No WD snap: this path only
    // triggers for malformed tasks without startDate; "today" is acceptable.
    const today = toISODateString(new Date());
    const startDate = addDays(today, -(DEFAULT_TASK_DURATION - 1));
    return { startDate, endDate: today, duration: DEFAULT_TASK_DURATION };
  }

  // direction === "below"
  if (refTask.endDate) {
    let startDate = addDays(
      refTask.endDate,
      1 + offset * (DEFAULT_TASK_DURATION + 1)
    );

    if (ctx?.enabled) {
      startDate = snapForwardToWorkingDay(
        startDate,
        ctx.config,
        ctx.holidayRegion
      );
      const endDate = addWorkingDays(
        startDate,
        DEFAULT_TASK_DURATION,
        ctx.config,
        ctx.holidayRegion
      );
      return {
        startDate,
        endDate,
        duration: calculateDuration(startDate, endDate),
      };
    }

    const endDate = addDays(startDate, DEFAULT_TASK_DURATION - 1);
    return { startDate, endDate, duration: DEFAULT_TASK_DURATION };
  }
  // No reference end — fallback to today. No WD snap: this path only
  // triggers for malformed tasks without endDate; "today" is acceptable.
  const today = toISODateString(new Date());
  const endDate = addDays(today, DEFAULT_TASK_DURATION - 1);
  return { startDate: today, endDate, duration: DEFAULT_TASK_DURATION };
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
  const wdCtx = getWorkingDaysContext();

  for (let i = 0; i < count; i++) {
    const { startDate, endDate, duration } = computeInsertionDates(
      refTask,
      direction,
      i,
      wdCtx
    );

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
      duration,
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
