/**
 * Utility functions for collecting tasks for clipboard operations.
 * Respects user selection and collapsed state.
 */

import type { Task } from "../../types/chart.types";
import type { TaskId } from "../../types/branded.types";

/**
 * Recursively add children of a collapsed task to the collected set.
 * All descendants are included regardless of their own open/closed state,
 * because a collapsed ancestor hides the entire subtree.
 */
function collectChildrenOfCollapsed(
  taskId: TaskId,
  childrenMap: Map<TaskId, Task[]>,
  collected: Set<TaskId>,
  result: Task[]
): void {
  const children = childrenMap.get(taskId) ?? [];
  children.forEach((child) => {
    if (collected.has(child.id)) return;

    collected.add(child.id);
    result.push(child);

    collectChildrenOfCollapsed(child.id, childrenMap, collected, result);
  });
}

/**
 * Collect tasks for clipboard operation.
 *
 * Rules:
 * - Only copies explicitly selected tasks
 * - EXCEPTION: If a selected task is collapsed (open === false),
 *   also include its hidden children recursively
 *
 * @param taskIds - IDs of explicitly selected tasks
 * @param allTasks - Complete task list
 * @returns Array of tasks to copy
 */
export function collectTasksWithChildren(
  taskIds: TaskId[],
  allTasks: Task[]
): Task[] {
  const collected = new Set<TaskId>();
  const result: Task[] = [];

  // Pre-build O(1) lookup structures to avoid O(n) scans inside loops
  const taskMap = new Map<TaskId, Task>(allTasks.map((t) => [t.id, t]));
  const childrenMap = new Map<TaskId, Task[]>();
  allTasks.forEach((t) => {
    if (t.parent) {
      const siblings = childrenMap.get(t.parent) ?? [];
      siblings.push(t);
      childrenMap.set(t.parent, siblings);
    }
  });

  // Process each selected task
  taskIds.forEach((id) => {
    // Skip if already collected (e.g., as child of collapsed parent)
    if (collected.has(id)) return;

    const task = taskMap.get(id);
    if (!task) return;

    // Add the selected task
    collected.add(id);
    result.push(task);

    // If task is collapsed, also collect its hidden children
    if (task.open === false) {
      collectChildrenOfCollapsed(id, childrenMap, collected, result);
    }
  });

  return result;
}

/**
 * Deep clone tasks to avoid reference issues.
 * Uses JSON parse/stringify to ensure no Immer draft proxies.
 *
 * @param tasks - Tasks to clone
 * @returns Deep cloned tasks
 *
 * @remarks Assumes all Task fields are JSON-serializable (strings, numbers,
 * booleans, plain objects). Non-serializable values (Dates, undefined) would
 * be silently dropped or coerced.
 */
export function deepCloneTasks(tasks: Task[]): Task[] {
  return JSON.parse(JSON.stringify(tasks)) as Task[];
}
