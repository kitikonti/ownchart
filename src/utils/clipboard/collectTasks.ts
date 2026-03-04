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
function collectHiddenDescendants(
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

    collectHiddenDescendants(child.id, childrenMap, collected, result);
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
 * The result is sorted by the tasks' position in `allTasks` (visual order),
 * so the returned order is deterministic regardless of the order in which
 * `taskIds` were accumulated (e.g. from non-sequential Ctrl+click selection).
 *
 * @param taskIds - IDs of explicitly selected tasks
 * @param allTasks - Complete task list (defines canonical visual order)
 * @returns Array of tasks to copy, sorted in visual order
 */
export function collectTasksWithChildren(
  taskIds: TaskId[],
  allTasks: Task[]
): Task[] {
  const collected = new Set<TaskId>();
  const result: Task[] = [];

  // Pre-build O(1) lookup structures to avoid O(n) scans inside loops
  const taskMap = new Map<TaskId, Task>(allTasks.map((t) => [t.id, t]));
  const orderMap = new Map<TaskId, number>(allTasks.map((t, i) => [t.id, i]));
  const childrenMap = new Map<TaskId, Task[]>();
  allTasks.forEach((t) => {
    if (!t.parent) return;
    const siblings = childrenMap.get(t.parent);
    if (siblings) {
      siblings.push(t);
    } else {
      childrenMap.set(t.parent, [t]);
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
      collectHiddenDescendants(id, childrenMap, collected, result);
    }
  });

  // Sort by allTasks position to ensure deterministic visual order regardless
  // of how taskIds were accumulated (e.g. Ctrl+click in non-top-to-bottom order).
  return result.sort(
    (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
  );
}

/**
 * Deep clone tasks to avoid reference issues.
 * Uses structuredClone to ensure no Immer draft proxies.
 *
 * @param tasks - Tasks to clone
 * @returns Deep cloned tasks
 *
 * @remarks Task fields must be structuredClone-compatible (strings, numbers,
 * booleans, plain objects, arrays). Values in task.metadata that are functions,
 * class instances, or DOM nodes will throw — store only plain data in metadata.
 */
export function deepCloneTasks(tasks: Task[]): Task[] {
  return structuredClone(tasks);
}
