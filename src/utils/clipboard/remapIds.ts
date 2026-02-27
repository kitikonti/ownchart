/**
 * Utility functions for remapping task and dependency IDs.
 * Used during paste operations to generate new unique IDs.
 */

import type { Task } from "../../types/chart.types";
import type { TaskId } from "../../types/branded.types";
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
  const idMapping: Record<TaskId, TaskId> = {} as Record<TaskId, TaskId>;

  // First pass: Generate new IDs for all tasks
  tasks.forEach((task) => {
    const newId = crypto.randomUUID() as TaskId;
    idMapping[task.id] = newId;
  });

  // Second pass: Apply new IDs and remap parent references
  const remappedTasks: Task[] = tasks.map((task) => ({
    ...task,
    id: idMapping[task.id],
    // Remap parent if it exists in the mapping (internal parent)
    // Otherwise set to undefined (external parent removed)
    parent:
      task.parent && idMapping[task.parent]
        ? idMapping[task.parent]
        : undefined,
  }));

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
      // Only keep dependencies where both tasks are in the mapping
      (dep) => idMapping[dep.fromTaskId] && idMapping[dep.toTaskId]
    )
    .map((dep) => ({
      ...dep,
      id: crypto.randomUUID(), // New dependency ID
      fromTaskId: idMapping[dep.fromTaskId],
      toTaskId: idMapping[dep.toTaskId],
    }));
}
