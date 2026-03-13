/**
 * Topological Sort Algorithm for Dependencies
 * Uses Kahn's Algorithm to order tasks so predecessors come before successors.
 *
 * Time Complexity: O(V + E) where V = tasks, E = dependencies
 * Space Complexity: O(V + E)
 */

import type { TaskId } from "@/types/branded.types";
import type { Task } from "@/types/chart.types";
import type { Dependency } from "@/types/dependency.types";
import {
  buildAdjacencyList,
  buildReverseAdjacencyList,
  bfsReachable,
} from "./graphHelpers";

/**
 * Builds a forward adjacency list and per-node in-degree counts
 * for the subset of dependencies whose endpoints are both known tasks.
 *
 * All task IDs are guaranteed to be present in both returned maps
 * (empty adjacency list / zero in-degree as defaults), so callers may
 * use non-null assertions when accessing them.
 */
function buildInDegreeGraph(
  tasks: Task[],
  dependencies: Dependency[]
): { graph: Map<TaskId, TaskId[]>; inDegree: Map<TaskId, number> } {
  const validTaskIds = new Set<TaskId>(tasks.map((t) => t.id));
  const inDegree = new Map<TaskId, number>();
  const graph = new Map<TaskId, TaskId[]>();

  for (const task of tasks) {
    inDegree.set(task.id, 0);
    graph.set(task.id, []);
  }

  // Build adjacency list and in-degree counts — skip deps referencing unknown tasks.
  // Duplicate edges are processed as-is: each duplicate increments inDegree by 1 and
  // appends one extra entry to the adjacency list. Kahn's decrement loop then reduces
  // inDegree once per adjacency-list entry, so the counts stay in sync and every task
  // eventually reaches inDegree 0. No deduplication is required.
  for (const dep of dependencies) {
    if (validTaskIds.has(dep.fromTaskId) && validTaskIds.has(dep.toTaskId)) {
      // Non-null assertions are safe: graph and inDegree were pre-populated
      // for all valid task IDs above.
      graph.get(dep.fromTaskId)!.push(dep.toTaskId);
      inDegree.set(dep.toTaskId, inDegree.get(dep.toTaskId)! + 1);
    }
  }

  return { graph, inDegree };
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
  const { graph, inDegree } = buildInDegreeGraph(tasks, dependencies);

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
    // Non-null assertions are safe: taskMap and graph are keyed on task IDs,
    // and the queue is populated exclusively from those IDs.
    result.push(taskMap.get(current)!);

    for (const neighbor of graph.get(current)!) {
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
