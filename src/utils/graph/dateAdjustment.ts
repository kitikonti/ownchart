/**
 * Auto-Scheduling Date Adjustment Algorithm
 *
 * Calculates and propagates date constraints through the dependency graph.
 * Used when auto-scheduling is enabled to cascade predecessor date changes
 * to successor tasks based on dependency type (FS, SS, FF, SF) and lag.
 *
 * All functions are pure — no store dependencies.
 */

import type { Task } from "@/types/chart.types";
import type { TaskId } from "@/types/branded.types";
import type {
  Dependency,
  DependencyType,
  DateAdjustment,
} from "@/types/dependency.types";
import { addDays, calculateDuration } from "@/utils/dateUtils";
import { differenceInDays, parseISO } from "date-fns";
import { topologicalSort, getSuccessors } from "./topologicalSort";
import type { WorkingDaysConfig } from "@/types/preferences.types";
import {
  calculateWorkingDays,
  addWorkingDays,
} from "@/utils/workingDaysCalculator";

// ---------------------------------------------------------------------------
// Constraint calculation
// ---------------------------------------------------------------------------

interface PredecessorDates {
  startDate: string;
  endDate: string;
}

interface ConstrainedDates {
  startDate: string;
  endDate: string;
}

/**
 * Calculate the earliest allowed dates for a successor task based on a single
 * predecessor constraint.
 *
 * @param predecessor - Start/end dates of the predecessor task
 * @param successorDuration - Duration of the successor in days (inclusive)
 * @param type - Dependency type (FS, SS, FF, SF)
 * @param lag - Offset in days (positive = gap, negative = overlap). Defaults to 0.
 * @returns The earliest allowed { startDate, endDate } for the successor
 */
export function calculateConstrainedDates(
  predecessor: PredecessorDates,
  successorDuration: number,
  type: DependencyType,
  lag: number = 0
): ConstrainedDates {
  switch (type) {
    case "FS": {
      // successor.start >= predecessor.end + 1 + lag
      // +1 because endDate is the last work day (inclusive)
      const start = addDays(predecessor.endDate, 1 + lag);
      const end = addDays(start, successorDuration - 1);
      return { startDate: start, endDate: end };
    }
    case "SS": {
      // successor.start >= predecessor.start + lag
      const start = addDays(predecessor.startDate, lag);
      const end = addDays(start, successorDuration - 1);
      return { startDate: start, endDate: end };
    }
    case "FF": {
      // successor.end >= predecessor.end + lag
      const end = addDays(predecessor.endDate, lag);
      const start = addDays(end, -(successorDuration - 1));
      return { startDate: start, endDate: end };
    }
    case "SF": {
      // successor.end >= predecessor.start + lag
      const end = addDays(predecessor.startDate, lag);
      const start = addDays(end, -(successorDuration - 1));
      return { startDate: start, endDate: end };
    }
  }
}

/**
 * Calculate the initial lag that preserves the current task positions when
 * creating a dependency. This is the inverse of calculateConstrainedDates:
 * given the actual positions of predecessor and successor, it computes the lag
 * that would produce those exact positions under the given dependency type.
 *
 * @param predecessor - Start/end dates of the predecessor task
 * @param successor - Start/end dates of the successor task
 * @param type - Dependency type (FS, SS, FF, SF)
 * @returns The lag in days (positive = gap, negative = overlap)
 */
export function calculateInitialLag(
  predecessor: PredecessorDates,
  successor: PredecessorDates,
  type: DependencyType
): number {
  switch (type) {
    case "FS":
      // Inverse of: successor.start = predecessor.end + 1 + lag
      return (
        differenceInDays(
          parseISO(successor.startDate),
          parseISO(predecessor.endDate)
        ) - 1
      );
    case "SS":
      // Inverse of: successor.start = predecessor.start + lag
      return differenceInDays(
        parseISO(successor.startDate),
        parseISO(predecessor.startDate)
      );
    case "FF":
      // Inverse of: successor.end = predecessor.end + lag
      return differenceInDays(
        parseISO(successor.endDate),
        parseISO(predecessor.endDate)
      );
    case "SF":
      // Inverse of: successor.end = predecessor.start + lag
      return differenceInDays(
        parseISO(successor.endDate),
        parseISO(predecessor.startDate)
      );
  }
}

// ---------------------------------------------------------------------------
// Lag ↔ working-days conversion
// ---------------------------------------------------------------------------

/** Working-days context for lag conversion. */
export interface LagWorkingDaysContext {
  config: WorkingDaysConfig;
  holidayRegion?: string;
}

/**
 * Get the reference date from which lag is measured for a given dependency type.
 * - FS: predecessor end date (lag counts from day after end)
 * - SS: predecessor start date (lag counts from start)
 * - FF: predecessor end date (lag counts from end)
 * - SF: predecessor start date (lag counts from start)
 */
function getLagReferenceDate(
  predecessor: PredecessorDates,
  type: DependencyType
): string {
  switch (type) {
    case "FS":
    case "FF":
      return predecessor.endDate;
    case "SS":
    case "SF":
      return predecessor.startDate;
  }
}

/**
 * Convert a calendar-day lag to a working-day lag for display.
 *
 * The conversion is context-dependent: it uses the predecessor's reference
 * date to determine which specific calendar days fall in the gap, then
 * counts how many of those are working days.
 *
 * @param calendarLag - Lag in calendar days (stored value)
 * @param predecessor - Predecessor task dates
 * @param type - Dependency type
 * @param ctx - Working days configuration
 * @returns Lag expressed in working days
 */
export function lagCalendarToWorking(
  calendarLag: number,
  predecessor: PredecessorDates,
  type: DependencyType,
  ctx: LagWorkingDaysContext
): number {
  if (calendarLag === 0) return 0;

  const ref = getLagReferenceDate(predecessor, type);
  // For FS, lag is measured from ref+1. For SS/FF/SF, from ref itself.
  const offset = type === "FS" ? 1 : 0;

  if (calendarLag > 0) {
    const gapStart = addDays(ref, offset);
    const gapEnd = addDays(ref, offset + calendarLag - 1);
    return calculateWorkingDays(
      gapStart,
      gapEnd,
      ctx.config,
      ctx.holidayRegion
    );
  } else {
    // Negative lag (overlap): count working days in the overlap range
    const overlapStart = addDays(ref, offset + calendarLag);
    const overlapEnd = addDays(ref, offset - 1);
    return -calculateWorkingDays(
      overlapStart,
      overlapEnd,
      ctx.config,
      ctx.holidayRegion
    );
  }
}

/**
 * Convert a working-day lag (user input) to a calendar-day lag for storage.
 *
 * Given a desired working-day gap, compute how many calendar days are needed
 * from the predecessor's reference date to span that many working days.
 *
 * @param workingLag - Lag in working days (user input)
 * @param predecessor - Predecessor task dates
 * @param type - Dependency type
 * @param ctx - Working days configuration
 * @returns Lag expressed in calendar days (for storage)
 */
export function lagWorkingToCalendar(
  workingLag: number,
  predecessor: PredecessorDates,
  type: DependencyType,
  ctx: LagWorkingDaysContext
): number {
  if (workingLag === 0) return 0;

  const ref = getLagReferenceDate(predecessor, type);
  const offset = type === "FS" ? 1 : 0;

  if (workingLag > 0) {
    // Compute the successor's start date directly using working-day math.
    // For FS: the successor starts at the (workingLag + 1)th working day
    // after pred.end (the +1 accounts for the successor start itself).
    // Then derive the calendar lag from the start date.
    const dayAfterRef = addDays(ref, offset);
    const successorStart = addWorkingDays(
      dayAfterRef,
      workingLag + 1,
      ctx.config,
      ctx.holidayRegion
    );
    // FS: calendarLag = successorStart - pred.end - 1
    // SS: calendarLag = successorStart - pred.start
    return differenceInDays(parseISO(successorStart), parseISO(ref)) - offset;
  } else {
    // Negative lag: advance backward (approximate via forward scan)
    // For negative working-day lag, count backward from the reference point
    const absWorking = -workingLag;
    // Scan backward: find the date such that there are absWorking working days
    // between it and the reference point
    let candidateDate = addDays(ref, offset - 1);
    let found = 0;
    const maxIter = absWorking * 7 + 60; // safety limit
    for (let i = 0; i < maxIter && found < absWorking; i++) {
      candidateDate = addDays(candidateDate, -1);
      const wd = calculateWorkingDays(
        candidateDate,
        candidateDate,
        ctx.config,
        ctx.holidayRegion
      );
      if (wd > 0) found++;
    }
    return (
      differenceInDays(parseISO(candidateDate), parseISO(ref)) - offset + 1
    );
  }
}

// ---------------------------------------------------------------------------
// Date propagation
// ---------------------------------------------------------------------------

interface WorkingDates {
  startDate: string;
  endDate: string;
  duration: number;
}

/**
 * Propagate date constraints through the dependency graph.
 *
 * Uses topological sort to process tasks in dependency order, then enforces
 * each predecessor constraint. When a task has multiple predecessors, the most
 * restrictive constraint (latest required start date) wins.
 *
 * @param tasks - All tasks in the project
 * @param dependencies - All dependencies
 * @param changedTaskIds - Tasks whose dates just changed (optimization filter).
 *   When provided, only successor tasks reachable from these are processed.
 *   When omitted, all tasks are processed (full recalculation for toggle-ON).
 * @returns Array of DateAdjustment records for undo/redo support
 */
export function propagateDateChanges(
  tasks: Task[],
  dependencies: Dependency[],
  changedTaskIds?: TaskId[],
  options?: { bidirectional?: boolean }
): DateAdjustment[] {
  if (tasks.length === 0 || dependencies.length === 0) return [];

  // 1. Build working copy of task dates
  const workingCopy = new Map<TaskId, WorkingDates>();
  for (const task of tasks) {
    workingCopy.set(task.id, {
      startDate: task.startDate,
      endDate: task.endDate,
      duration: calculateDuration(task.startDate, task.endDate),
    });
  }

  // 2. Compute reachable set (optimization)
  let scope: Set<TaskId> | null = null;
  if (changedTaskIds && changedTaskIds.length > 0) {
    scope = new Set<TaskId>();
    for (const taskId of changedTaskIds) {
      const successors = getSuccessors(taskId, dependencies);
      for (const s of successors) {
        scope.add(s);
      }
    }
    if (scope.size === 0) return [];
  }

  // 3. Topological sort for processing order
  const sorted = topologicalSort(tasks, dependencies);

  // 4. Build reverse dependency map: toTaskId → Dependency[]
  const predecessorMap = new Map<TaskId, Dependency[]>();
  for (const dep of dependencies) {
    let list = predecessorMap.get(dep.toTaskId);
    if (!list) {
      list = [];
      predecessorMap.set(dep.toTaskId, list);
    }
    list.push(dep);
  }

  // 5. Walk topological order and enforce constraints
  const adjustments: DateAdjustment[] = [];

  for (const task of sorted) {
    // Skip tasks outside the reachable scope
    if (scope && !scope.has(task.id)) continue;

    // Skip summary tasks (dates derived from children)
    if (task.type === "summary") continue;

    const deps = predecessorMap.get(task.id);
    if (!deps || deps.length === 0) continue;

    const current = workingCopy.get(task.id);
    if (!current) continue;

    // Find the most restrictive constraint across all predecessors
    let latestRequiredStart: string | null = null;
    let latestRequiredEnd: string | null = null;

    for (const dep of deps) {
      const predDates = workingCopy.get(dep.fromTaskId);
      if (!predDates) continue;

      const constrained = calculateConstrainedDates(
        predDates,
        current.duration,
        dep.type,
        dep.lag ?? 0
      );

      // Compare by start date — take the latest (most restrictive)
      if (
        latestRequiredStart === null ||
        constrained.startDate > latestRequiredStart
      ) {
        latestRequiredStart = constrained.startDate;
        latestRequiredEnd = constrained.endDate;
      }
    }

    // Apply adjustment if the task needs to move.
    // Forward-only (default): only move if constraint requires a later start.
    // Bidirectional: move to the exact constraint position (earlier or later).
    const needsMove =
      latestRequiredStart !== null &&
      latestRequiredEnd !== null &&
      (options?.bidirectional
        ? latestRequiredStart !== current.startDate
        : latestRequiredStart > current.startDate);
    if (
      needsMove &&
      latestRequiredStart !== null &&
      latestRequiredEnd !== null
    ) {
      adjustments.push({
        taskId: task.id,
        oldStartDate: current.startDate,
        oldEndDate: current.endDate,
        newStartDate: latestRequiredStart,
        newEndDate: latestRequiredEnd,
      });

      // Update working copy so downstream tasks see the new dates
      workingCopy.set(task.id, {
        startDate: latestRequiredStart,
        endDate: latestRequiredEnd,
        duration: current.duration,
      });
    }
  }

  return adjustments;
}

// ---------------------------------------------------------------------------
// Batch apply helpers
// ---------------------------------------------------------------------------

/**
 * Apply or reverse date adjustments on a mutable tasks array (Immer draft).
 * Uses a Map index for O(1) lookup per adjustment.
 *
 * @param adjustments - DateAdjustment records to apply/reverse
 * @param tasks - Mutable tasks array (Immer draft)
 * @param direction - "apply" uses new dates, "reverse" restores old dates
 * @returns Set of parent task IDs that may need summary recalculation
 */
function batchUpdateDates(
  adjustments: DateAdjustment[],
  tasks: Task[],
  direction: "apply" | "reverse"
): Set<TaskId> {
  if (adjustments.length === 0) return new Set();

  // Build index for O(1) lookup
  const taskIndex = new Map<TaskId, number>();
  for (let i = 0; i < tasks.length; i++) {
    taskIndex.set(tasks[i].id, i);
  }

  const affectedParentIds = new Set<TaskId>();

  for (const adj of adjustments) {
    const idx = taskIndex.get(adj.taskId);
    if (idx === undefined) continue;

    const task = tasks[idx];
    const startDate =
      direction === "apply" ? adj.newStartDate : adj.oldStartDate;
    const endDate = direction === "apply" ? adj.newEndDate : adj.oldEndDate;

    task.startDate = startDate;
    task.endDate = endDate;
    task.duration = calculateDuration(startDate, endDate);

    if (task.parent) {
      affectedParentIds.add(task.parent);
    }
  }

  return affectedParentIds;
}

/** Apply date adjustments (use new dates). Returns affected parent IDs. */
export function applyDateAdjustments(
  adjustments: DateAdjustment[],
  tasks: Task[]
): Set<TaskId> {
  return batchUpdateDates(adjustments, tasks, "apply");
}

/** Reverse date adjustments (restore old dates). Returns affected parent IDs. */
export function reverseDateAdjustments(
  adjustments: DateAdjustment[],
  tasks: Task[]
): Set<TaskId> {
  return batchUpdateDates(adjustments, tasks, "reverse");
}
