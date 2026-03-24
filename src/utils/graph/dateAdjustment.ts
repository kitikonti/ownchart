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
import { topologicalSort, getSuccessors } from "./topologicalSort";

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
  changedTaskIds?: TaskId[]
): DateAdjustment[] {
  if (dependencies.length === 0) return [];

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

    // Apply adjustment if the task needs to move forward
    if (
      latestRequiredStart !== null &&
      latestRequiredEnd !== null &&
      latestRequiredStart > current.startDate
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
// Batch apply helper
// ---------------------------------------------------------------------------

/**
 * Apply date adjustments to a mutable tasks array (Immer draft).
 * Uses a Map index for O(1) lookup per adjustment.
 *
 * @param adjustments - DateAdjustment records to apply
 * @param tasks - Mutable tasks array (Immer draft)
 * @returns Set of parent task IDs that may need summary recalculation
 */
export function applyDateAdjustments(
  adjustments: DateAdjustment[],
  tasks: Task[]
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
    task.startDate = adj.newStartDate;
    task.endDate = adj.newEndDate;
    task.duration = calculateDuration(adj.newStartDate, adj.newEndDate);

    if (task.parent) {
      affectedParentIds.add(task.parent);
    }
  }

  return affectedParentIds;
}

/**
 * Reverse-apply date adjustments (restore old dates) on a mutable tasks array.
 * Used for undo operations.
 *
 * @param adjustments - DateAdjustment records to reverse
 * @param tasks - Mutable tasks array (Immer draft)
 * @returns Set of parent task IDs that may need summary recalculation
 */
export function reverseeDateAdjustments(
  adjustments: DateAdjustment[],
  tasks: Task[]
): Set<TaskId> {
  if (adjustments.length === 0) return new Set();

  const taskIndex = new Map<TaskId, number>();
  for (let i = 0; i < tasks.length; i++) {
    taskIndex.set(tasks[i].id, i);
  }

  const affectedParentIds = new Set<TaskId>();

  for (const adj of adjustments) {
    const idx = taskIndex.get(adj.taskId);
    if (idx === undefined) continue;

    const task = tasks[idx];
    task.startDate = adj.oldStartDate;
    task.endDate = adj.oldEndDate;
    task.duration = calculateDuration(adj.oldStartDate, adj.oldEndDate);

    if (task.parent) {
      affectedParentIds.add(task.parent);
    }
  }

  return affectedParentIds;
}
