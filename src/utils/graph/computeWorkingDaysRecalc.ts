/**
 * Pure computation of schedule adjustments when working-days config changes.
 *
 * Two user-selectable modes:
 *
 * **keep-positions**: Task bars stay on the timeline. Durations and lags are
 *   recalculated to match the new working-day definition. No visual change.
 *
 * **keep-durations**: Numeric duration/lag values are preserved. Task positions
 *   are recomputed under the new calendar, then dependencies cascade.
 */

import type { Task } from "@/types/chart.types";
import type {
  Dependency,
  DependencyType,
  DateAdjustment,
} from "@/types/dependency.types";
import type { TaskId } from "@/types/branded.types";
import type { WorkingDaysContext } from "@/utils/workingDaysCalculator";
import {
  snapForwardToWorkingDay,
  calculateWorkingDays,
  addWorkingDays,
} from "@/utils/workingDaysCalculator";
import {
  calculateInitialLag,
  propagateDateChanges,
} from "@/utils/graph/dateAdjustment";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface DurationChange {
  taskId: TaskId;
  oldDuration: number;
  newDuration: number;
}

export interface LagChange {
  depId: string;
  oldLag: number;
  newLag: number;
}

export interface RecalcResult {
  dateAdjustments: DateAdjustment[];
  durationChanges: DurationChange[];
  lagChanges: LagChange[];
}

export type RecalcMode = "keep-positions" | "keep-durations";

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function computeWorkingDaysRecalc(
  tasks: Task[],
  dependencies: Dependency[],
  newCtx: WorkingDaysContext,
  oldCtx: WorkingDaysContext,
  mode: RecalcMode
): RecalcResult {
  const empty: RecalcResult = {
    dateAdjustments: [],
    durationChanges: [],
    lagChanges: [],
  };
  if (tasks.length === 0) return empty;

  return mode === "keep-positions"
    ? keepPositions(tasks, dependencies, newCtx)
    : keepDurations(tasks, dependencies, newCtx, oldCtx);
}

// ---------------------------------------------------------------------------
// Option 1: Keep positions — recalculate durations & lags
// ---------------------------------------------------------------------------

function keepPositions(
  tasks: Task[],
  dependencies: Dependency[],
  newCtx: WorkingDaysContext
): RecalcResult {
  const durationChanges: DurationChange[] = [];

  for (const t of tasks) {
    if (t.type === "summary" || t.type === "milestone") continue;

    const newDuration = calculateWorkingDays(
      t.startDate,
      t.endDate,
      newCtx.config,
      newCtx.holidayRegion
    );

    if (newDuration !== t.duration) {
      durationChanges.push({
        taskId: t.id,
        oldDuration: t.duration,
        newDuration,
      });
    }
  }

  // Recalculate lag for every dependency using the new WD config
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const lagChanges: LagChange[] = [];

  for (const dep of dependencies) {
    const pred = taskMap.get(dep.fromTaskId);
    const succ = taskMap.get(dep.toTaskId);
    if (!pred || !succ) continue;

    const newLag = calculateInitialLag(
      { startDate: pred.startDate, endDate: pred.endDate },
      { startDate: succ.startDate, endDate: succ.endDate },
      dep.type as DependencyType,
      newCtx
    );

    const oldLag = dep.lag ?? 0;
    if (newLag !== oldLag) {
      lagChanges.push({ depId: dep.id, oldLag, newLag });
    }
  }

  return { dateAdjustments: [], durationChanges, lagChanges };
}

// ---------------------------------------------------------------------------
// Option 2: Keep durations — recalculate positions
// ---------------------------------------------------------------------------

function keepDurations(
  tasks: Task[],
  dependencies: Dependency[],
  newCtx: WorkingDaysContext,
  oldCtx: WorkingDaysContext
): RecalcResult {
  // Phase 1: Recompute each task's calendar span
  const dateAdjustments = new Map<string, DateAdjustment>();
  const adjustedTasks = tasks.map((t) => {
    if (t.type === "summary" || t.type === "milestone") return { ...t };

    // Count WD under OLD config (the task's "true" duration)
    const wdDuration = calculateWorkingDays(
      t.startDate,
      t.endDate,
      oldCtx.config,
      oldCtx.holidayRegion
    );

    if (wdDuration <= 0) return { ...t };

    // Snap start to working day under NEW config
    const newStart = snapForwardToWorkingDay(
      t.startDate,
      newCtx.config,
      newCtx.holidayRegion
    );

    // Lay out wdDuration working days under NEW config
    const newEnd = addWorkingDays(
      newStart,
      wdDuration,
      newCtx.config,
      newCtx.holidayRegion
    );

    if (newStart !== t.startDate || newEnd !== t.endDate) {
      dateAdjustments.set(t.id, {
        taskId: t.id,
        oldStartDate: t.startDate,
        oldEndDate: t.endDate,
        newStartDate: newStart,
        newEndDate: newEnd,
      });
      return { ...t, startDate: newStart, endDate: newEnd };
    }
    return { ...t };
  });

  // Phase 2: Propagate dependencies (always, bidirectional)
  if (dependencies.length > 0) {
    const propagated = propagateDateChanges(
      adjustedTasks,
      dependencies,
      undefined,
      { bidirectional: true, workingDays: newCtx }
    );

    for (const adj of propagated) {
      const prev = dateAdjustments.get(adj.taskId);
      dateAdjustments.set(adj.taskId, {
        taskId: adj.taskId,
        oldStartDate: prev?.oldStartDate ?? adj.oldStartDate,
        oldEndDate: prev?.oldEndDate ?? adj.oldEndDate,
        newStartDate: adj.newStartDate,
        newEndDate: adj.newEndDate,
      });
    }
  }

  const filtered = [...dateAdjustments.values()].filter(
    (a) => a.oldStartDate !== a.newStartDate || a.oldEndDate !== a.newEndDate
  );

  return { dateAdjustments: filtered, durationChanges: [], lagChanges: [] };
}
