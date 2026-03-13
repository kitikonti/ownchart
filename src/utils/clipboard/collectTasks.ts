/**
 * Utility functions for collecting tasks for clipboard operations.
 * Respects user selection and collapsed state.
 */

import type { Task } from "@/types/chart.types";
import type { TaskId } from "@/types/branded.types";

/**
 * Collect all hidden descendants of a collapsed task using an iterative DFS.
 * All descendants are included regardless of their own open/closed state,
 * because a collapsed ancestor hides the entire subtree.
 * Updates `collected` in-place as a deduplication guard shared across the traversal.
 */
function collectHiddenDescendants(
  taskId: TaskId,
  childrenMap: Map<TaskId, Task[]>,
  collected: Set<TaskId>
): Task[] {
  const result: Task[] = [];
  // Iterative DFS via explicit stack — avoids call-stack overflow on deep hierarchies
  // and eliminates per-level intermediate array allocations from recursive spreading.
  const toProcess: TaskId[] = [taskId];
  while (toProcess.length > 0) {
    const currentId = toProcess.pop()!;
    for (const child of childrenMap.get(currentId) ?? []) {
      if (collected.has(child.id)) continue;
      collected.add(child.id);
      result.push(child);
      toProcess.push(child.id);
    }
  }
  return result;
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

    // If task is collapsed, also collect its hidden children.
    // Use a for..of loop rather than push(...spread) to avoid hitting the JS
    // maximum argument limit when a collapsed subtree has thousands of nodes.
    if (task.open === false) {
      for (const t of collectHiddenDescendants(id, childrenMap, collected)) {
        result.push(t);
      }
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
  try {
    return structuredClone(tasks);
  } catch (error) {
    // structuredClone throws DataCloneError for non-serializable values (functions,
    // DOM nodes, class instances). Only plain data should live in task.metadata.
    throw new Error(
      `deepCloneTasks: task.metadata contains a non-cloneable value. ` +
        `Ensure all metadata values are strings, numbers, booleans, plain objects, ` +
        `or arrays. Cause: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
