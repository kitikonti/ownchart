/**
 * Topological Sort Algorithm for Dependencies
 * Uses Kahn's Algorithm to order tasks so predecessors come before successors.
 *
 * Time Complexity: O(V + E) where V = tasks, E = dependencies
 * Space Complexity: O(V)
 */

import type { Task } from "../../types/chart.types";
import type { Dependency } from "../../types/dependency.types";

/**
 * Sort tasks in topological order based on dependencies.
 * Tasks with no predecessors come first.
 *
 * @param tasks - Array of all tasks
 * @param dependencies - Array of all dependencies
 * @returns Tasks sorted in topological order
 */
export function topologicalSort(
  tasks: Task[],
  dependencies: Dependency[]
): Task[] {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const inDegree = new Map<string, number>();
  const graph = new Map<string, string[]>();

  // Initialize all tasks with 0 in-degree
  for (const task of tasks) {
    inDegree.set(task.id, 0);
    graph.set(task.id, []);
  }

  // Build graph and count in-degrees
  for (const dep of dependencies) {
    // Only process if both tasks exist
    if (taskMap.has(dep.fromTaskId) && taskMap.has(dep.toTaskId)) {
      graph.get(dep.fromTaskId)!.push(dep.toTaskId);
      inDegree.set(dep.toTaskId, (inDegree.get(dep.toTaskId) || 0) + 1);
    }
  }

  // Start with tasks that have no predecessors
  const queue: string[] = [];
  for (const [taskId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(taskId);
    }
  }

  const result: Task[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const task = taskMap.get(current);
    if (task) {
      result.push(task);
    }

    for (const neighbor of graph.get(current) || []) {
      const newDegree = inDegree.get(neighbor)! - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  return result;
}

/**
 * Get all successor task IDs for a given task (direct and transitive).
 *
 * @param taskId - The task to find successors for
 * @param dependencies - Array of all dependencies
 * @returns Set of successor task IDs
 */
export function getSuccessors(
  taskId: string,
  dependencies: Dependency[]
): Set<string> {
  const successors = new Set<string>();
  const graph = new Map<string, string[]>();

  // Build adjacency list
  for (const dep of dependencies) {
    if (!graph.has(dep.fromTaskId)) {
      graph.set(dep.fromTaskId, []);
    }
    graph.get(dep.fromTaskId)!.push(dep.toTaskId);
  }

  // BFS to find all reachable nodes
  const queue = [taskId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const neighbor of graph.get(current) || []) {
      if (!successors.has(neighbor)) {
        successors.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return successors;
}

/**
 * Get all predecessor task IDs for a given task (direct and transitive).
 *
 * @param taskId - The task to find predecessors for
 * @param dependencies - Array of all dependencies
 * @returns Set of predecessor task IDs
 */
export function getPredecessors(
  taskId: string,
  dependencies: Dependency[]
): Set<string> {
  const predecessors = new Set<string>();

  // Build reverse adjacency list
  const reverseGraph = new Map<string, string[]>();
  for (const dep of dependencies) {
    if (!reverseGraph.has(dep.toTaskId)) {
      reverseGraph.set(dep.toTaskId, []);
    }
    reverseGraph.get(dep.toTaskId)!.push(dep.fromTaskId);
  }

  // BFS to find all predecessors
  const queue = [taskId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const neighbor of reverseGraph.get(current) || []) {
      if (!predecessors.has(neighbor)) {
        predecessors.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return predecessors;
}
