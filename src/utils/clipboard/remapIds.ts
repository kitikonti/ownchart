/**
 * Utility functions for remapping task and dependency IDs.
 * Used during paste operations to generate new unique IDs.
 */

import type { Task } from "../../types/chart.types";
import { type TaskId, toTaskId } from "../../types/branded.types";
import type { Dependency } from "../../types/dependency.types";

/**
 * Generate new UUIDs for tasks and create ID mapping.
 * Also remaps parent IDs to maintain hierarchy within the pasted set.
 *
 * @param tasks - Tasks to remap
 * @returns Object with remapped tasks and ID mapping
 */
export function remapTaskIds(tasks: Task[]): {
  remappedTasks: Task[];
  idMapping: Record<TaskId, TaskId>;
} {
  // Build the full mapping atomically via Object.fromEntries — the object is
  // complete at construction rather than mutated across a separate loop.
  // The `as` assertion is still required: TypeScript cannot verify that all
  // branded TaskId keys are present in the Record (Object.fromEntries returns
  // Record<string, TaskId>, not Record<TaskId, TaskId>).
  const idMapping = Object.fromEntries(
    tasks.map((task) => [task.id, toTaskId(crypto.randomUUID())])
  ) as Record<TaskId, TaskId>;

  // Apply new IDs and remap parent references
  const remappedTasks: Task[] = tasks.map((task) => {
    // Remap parent if it exists in the mapping (internal parent).
    // Cast to TaskId | undefined: Record<TaskId,TaskId> types all keys as present,
    // but a parent not in the pasted set returns undefined at runtime.
    const mappedParent = task.parent
      ? (idMapping[task.parent] as TaskId | undefined)
      : undefined;
    return {
      ...task,
      id: idMapping[task.id],
      parent: mappedParent,
    };
  });

  return { remappedTasks, idMapping };
}

/**
 * Remap dependency IDs using the task ID mapping.
 * Only dependencies where BOTH tasks are in the mapping will be included.
 *
 * @param deps - Dependencies to remap
 * @param idMapping - Mapping from old task IDs to new task IDs
 * @returns Array of remapped dependencies
 */
export function remapDependencies(
  deps: Dependency[],
  idMapping: Record<TaskId, TaskId>
): Dependency[] {
  return deps
    .filter(
      // Only keep dependencies where both tasks are in the pasted set.
      // hasOwnProperty.call checks own properties only, avoiding prototype-chain
      // false positives (e.g. fromTaskId === "constructor") that the `in`
      // operator would incorrectly include. dep.fromTaskId/toTaskId come from
      // clipboard data validated only as non-empty strings, not as UUIDs, so
      // prototype-chain safety cannot be assumed.
      (dep) =>
        Object.prototype.hasOwnProperty.call(idMapping, dep.fromTaskId) &&
        Object.prototype.hasOwnProperty.call(idMapping, dep.toTaskId)
    )
    .map((dep) => ({
      ...dep,
      id: crypto.randomUUID(), // New dependency ID
      fromTaskId: idMapping[dep.fromTaskId],
      toTaskId: idMapping[dep.toTaskId],
    }));
}
