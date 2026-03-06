/**
 * Topological Sort Algorithm for Dependencies
 * Uses Kahn's Algorithm to order tasks so predecessors come before successors.
 *
 * Time Complexity: O(V + E) where V = tasks, E = dependencies
 * Space Complexity: O(V + E)
 */

import type { TaskId } from "../../types/branded.types";
import type { Task } from "../../types/chart.types";
import type { Dependency } from "../../types/dependency.types";

/** Build a forward adjacency list (fromTaskId → [toTaskId, ...]) from a dependency array. */
function buildAdjacencyList(deps: Dependency[]): Map<TaskId, TaskId[]> {
  const graph = new Map<TaskId, TaskId[]>();
  for (const dep of deps) {
    if (!graph.has(dep.fromTaskId)) {
      graph.set(dep.fromTaskId, []);
    }
    graph.get(dep.fromTaskId)!.push(dep.toTaskId);
  }
  return graph;
}

/** Build a reverse adjacency list (toTaskId → [fromTaskId, ...]) for predecessor traversal. */
function buildReverseAdjacencyList(deps: Dependency[]): Map<TaskId, TaskId[]> {
  const graph = new Map<TaskId, TaskId[]>();
  for (const dep of deps) {
    if (!graph.has(dep.toTaskId)) {
      graph.set(dep.toTaskId, []);
    }
    graph.get(dep.toTaskId)!.push(dep.fromTaskId);
  }
  return graph;
}

/**
 * BFS from `startId` returning all reachable nodes (excluding `startId` itself).
 * Uses a pointer-based queue for O(1) dequeue — overall O(V + E).
 *
 * `startId` is pre-marked as visited so it is never added to the result set,
 * even in graphs that contain cycles leading back to it.
 */
function bfsReachable(
  startId: TaskId,
  graph: Map<TaskId, TaskId[]>
): Set<TaskId> {
  const reachable = new Set<TaskId>();
  const queue: TaskId[] = [startId];
  let head = 0;
  const visited = new Set<TaskId>([startId]);

  while (head < queue.length) {
    const current = queue[head++];
    for (const neighbor of graph.get(current) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        reachable.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return reachable;
}

/**
 * Sort tasks in topological order based on dependencies.
 * Tasks with no predecessors come first.
 *
 * Uses Kahn's algorithm with a pointer-based queue for true O(V + E) performance.
 *
 * If the dependency graph contains a cycle, tasks that are part of the cycle are
 * omitted from the result (partial sort). Call `detectCycle()` before this function
 * when cycles are possible — the caller is responsible for ensuring a DAG.
 *
 * @param tasks - Array of all tasks
 * @param dependencies - Array of all dependencies
 * @returns Tasks sorted in topological order. If a cycle exists, tasks in the
 *   cycle are absent from the result (incomplete list). Always call detectCycle() first.
 */
export function topologicalSort(
  tasks: Task[],
  dependencies: Dependency[]
): Task[] {
  const taskMap = new Map<TaskId, Task>(tasks.map((t) => [t.id, t]));
  const inDegree = new Map<TaskId, number>();
  const graph = new Map<TaskId, TaskId[]>();

  // Initialize all tasks with 0 in-degree
  for (const task of tasks) {
    inDegree.set(task.id, 0);
    graph.set(task.id, []);
  }

  // Build graph and count in-degrees (skip deps referencing unknown tasks)
  for (const dep of dependencies) {
    if (taskMap.has(dep.fromTaskId) && taskMap.has(dep.toTaskId)) {
      graph.get(dep.fromTaskId)!.push(dep.toTaskId);
      inDegree.set(dep.toTaskId, (inDegree.get(dep.toTaskId) ?? 0) + 1);
    }
  }

  // Enqueue all tasks with no incoming edges
  const queue: TaskId[] = [];
  let head = 0;
  for (const [taskId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(taskId);
    }
  }

  const result: Task[] = [];

  while (head < queue.length) {
    const current = queue[head++];
    const task = taskMap.get(current);
    if (task) {
      result.push(task);
    }

    for (const neighbor of graph.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 0) - 1;
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
 * @returns Set of successor task IDs. The starting task is never included in the
 *   result, even if the graph contains a cycle that leads back to it.
 */
export function getSuccessors(
  taskId: TaskId,
  dependencies: Dependency[]
): Set<TaskId> {
  return bfsReachable(taskId, buildAdjacencyList(dependencies));
}

/**
 * Get all predecessor task IDs for a given task (direct and transitive).
 *
 * @param taskId - The task to find predecessors for
 * @param dependencies - Array of all dependencies
 * @returns Set of predecessor task IDs. The starting task is never included in the
 *   result, even if the graph contains a cycle that leads back to it.
 */
export function getPredecessors(
  taskId: TaskId,
  dependencies: Dependency[]
): Set<TaskId> {
  return bfsReachable(taskId, buildReverseAdjacencyList(dependencies));
}
