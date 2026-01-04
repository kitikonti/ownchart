/**
 * Date Propagation Algorithm for Dependencies
 * Calculates how task dates should shift based on Finish-to-Start dependencies.
 *
 * Time Complexity: O(V + E) where V = tasks, E = dependencies
 */

import type { Task } from "../../types/chart.types";
import type { Dependency, DateAdjustment } from "../../types/dependency.types";
import { topologicalSort } from "./topologicalSort";

/**
 * Add days to a date string.
 */
function addDays(dateString: string, days: number): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

/**
 * Calculate the number of days between two dates.
 */
function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate required date adjustments when a task changes or a dependency is added.
 *
 * For FS (Finish-to-Start) dependencies:
 * - Successor must start after predecessor ends (+ lag days)
 *
 * @param tasks - Current list of all tasks
 * @param dependencies - Current list of all dependencies
 * @param changedTaskId - The task that changed (or predecessor in new dependency)
 * @returns Array of date adjustments to apply
 */
export function calculateDateAdjustments(
  tasks: Task[],
  dependencies: Dependency[],
  changedTaskId?: string
): DateAdjustment[] {
  const adjustments: DateAdjustment[] = [];
  const taskMap = new Map(tasks.map((t) => [t.id, { ...t }])); // Clone for mutation

  // Build predecessor map for quick lookup
  const predecessorDeps = new Map<string, Dependency[]>();
  for (const dep of dependencies) {
    if (!predecessorDeps.has(dep.toTaskId)) {
      predecessorDeps.set(dep.toTaskId, []);
    }
    predecessorDeps.get(dep.toTaskId)!.push(dep);
  }

  // Get tasks in topological order
  const sortedTasks = topologicalSort(tasks, dependencies);

  // If a specific task changed, only process its successors
  let startIndex = 0;
  if (changedTaskId) {
    startIndex = sortedTasks.findIndex((t) => t.id === changedTaskId) + 1;
  }

  const tasksToProcess = sortedTasks.slice(startIndex);

  // Process each task in topological order
  for (const task of tasksToProcess) {
    const deps = predecessorDeps.get(task.id) || [];
    if (deps.length === 0) continue;

    // Find the latest required start date based on all predecessors
    let latestRequiredStart: Date | null = null;

    for (const dep of deps) {
      const predecessor = taskMap.get(dep.fromTaskId);
      if (!predecessor) continue;

      // For FS: successor starts after predecessor ends
      const predEnd = new Date(predecessor.endDate);
      const lag = dep.lag || 0;

      // Required start = predecessor end + 1 day + lag
      const requiredStart = new Date(predEnd);
      requiredStart.setDate(requiredStart.getDate() + 1 + lag);

      if (!latestRequiredStart || requiredStart > latestRequiredStart) {
        latestRequiredStart = requiredStart;
      }
    }

    if (!latestRequiredStart) continue;

    // Check if task needs to move
    const currentTask = taskMap.get(task.id)!;
    const currentStart = new Date(currentTask.startDate);

    if (latestRequiredStart > currentStart) {
      // Calculate shift
      const daysDiff = Math.ceil(
        (latestRequiredStart.getTime() - currentStart.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      const newStartDate = addDays(currentTask.startDate, daysDiff);
      const newEndDate = addDays(currentTask.endDate, daysDiff);

      adjustments.push({
        taskId: task.id,
        oldStartDate: currentTask.startDate,
        oldEndDate: currentTask.endDate,
        newStartDate,
        newEndDate,
      });

      // Update task map for cascading propagation
      currentTask.startDate = newStartDate;
      currentTask.endDate = newEndDate;
    }
  }

  return adjustments;
}

/**
 * Check if a task's dates violate any dependency constraints.
 *
 * @param task - The task to check
 * @param dependencies - All dependencies involving this task
 * @param taskMap - Map of task ID to task
 * @returns Array of violated dependencies with details
 */
export function checkDependencyViolations(
  task: Task,
  dependencies: Dependency[],
  taskMap: Map<string, Task>
): Array<{ dependency: Dependency; violation: string }> {
  const violations: Array<{ dependency: Dependency; violation: string }> = [];

  // Check as successor (predecessors must end before this task starts)
  const predecessorDeps = dependencies.filter((d) => d.toTaskId === task.id);
  for (const dep of predecessorDeps) {
    const predecessor = taskMap.get(dep.fromTaskId);
    if (!predecessor) continue;

    const lag = dep.lag || 0;
    const predEnd = new Date(predecessor.endDate);
    const taskStart = new Date(task.startDate);
    const requiredStart = new Date(predEnd);
    requiredStart.setDate(requiredStart.getDate() + 1 + lag);

    if (taskStart < requiredStart) {
      const daysBefore = daysBetween(
        task.startDate,
        addDays(predecessor.endDate, lag)
      );
      violations.push({
        dependency: dep,
        violation: `Task starts ${Math.abs(daysBefore)} day(s) before predecessor "${predecessor.name}" ends`,
      });
    }
  }

  return violations;
}

/**
 * Calculate the earliest possible start date for a task based on its predecessors.
 *
 * @param taskId - The task to check
 * @param dependencies - All dependencies
 * @param taskMap - Map of task ID to task
 * @returns Earliest possible start date or null if no constraints
 */
export function getEarliestStartDate(
  taskId: string,
  dependencies: Dependency[],
  taskMap: Map<string, Task>
): string | null {
  const predecessorDeps = dependencies.filter((d) => d.toTaskId === taskId);

  if (predecessorDeps.length === 0) return null;

  let latestRequired: Date | null = null;

  for (const dep of predecessorDeps) {
    const predecessor = taskMap.get(dep.fromTaskId);
    if (!predecessor) continue;

    const lag = dep.lag || 0;
    const predEnd = new Date(predecessor.endDate);
    predEnd.setDate(predEnd.getDate() + 1 + lag);

    if (!latestRequired || predEnd > latestRequired) {
      latestRequired = predEnd;
    }
  }

  return latestRequired ? latestRequired.toISOString().split("T")[0] : null;
}
