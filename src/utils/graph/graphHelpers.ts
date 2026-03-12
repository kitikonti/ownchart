/**
 * Internal graph construction utilities.
 * Not exported from the public graph index — consumed only within this package.
 */

import type { TaskId } from "../../types/branded.types";
import type { Dependency } from "../../types/dependency.types";

/**
 * Returns the array stored under `key`, inserting an empty one first if absent.
 * Avoids non-null assertions at call sites where the key may not yet exist.
 *
 * @param map - The map to read from / write to.
 * @param key - The key whose list should be retrieved or created.
 * @returns The existing or newly-created array for `key`.
 */
export function getOrCreateList<K, V>(map: Map<K, V[]>, key: K): V[] {
  let list = map.get(key);
  if (list === undefined) {
    list = [];
    map.set(key, list);
  }
  return list;
}

/**
 * Build a forward adjacency list (fromTaskId → [toTaskId, ...]) from a dependency array.
 *
 * @param deps - The dependency edges to index.
 * @returns A map from each source task to its direct successors.
 */
export function buildAdjacencyList(deps: Dependency[]): Map<TaskId, TaskId[]> {
  const graph = new Map<TaskId, TaskId[]>();
  for (const dep of deps) {
    getOrCreateList(graph, dep.fromTaskId).push(dep.toTaskId);
  }
  return graph;
}

/**
 * Build a reverse adjacency list (toTaskId → [fromTaskId, ...]) for predecessor traversal.
 *
 * @param deps - The dependency edges to index.
 * @returns A map from each target task to its direct predecessors.
 */
export function buildReverseAdjacencyList(
  deps: Dependency[]
): Map<TaskId, TaskId[]> {
  const graph = new Map<TaskId, TaskId[]>();
  for (const dep of deps) {
    getOrCreateList(graph, dep.toTaskId).push(dep.fromTaskId);
  }
  return graph;
}

/**
 * BFS from `startId` returning all reachable nodes (excluding `startId` itself).
 * Uses a pointer-based queue for O(1) dequeue — overall O(V + E).
 *
 * `startId` is pre-marked as visited so it is never added to the result set,
 * even in graphs that contain cycles leading back to it.
 *
 * @param startId - The node to start traversal from (excluded from results).
 * @param graph - Forward adjacency list (node → neighbors).
 * @returns The set of all nodes reachable from `startId`, not including `startId` itself.
 */
export function bfsReachable(
  startId: TaskId,
  graph: Map<TaskId, TaskId[]>
): Set<TaskId> {
  const reachable = new Set<TaskId>();
  // Pointer-based queue: `head` advances instead of shifting, giving O(1) dequeue.
  // Processed entries remain in the array (O(V) transient memory) — an intentional
  // trade-off to avoid the O(n) cost of Array.prototype.shift on each iteration.
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
