/**
 * Internal graph construction utilities.
 * Exported for intra-package use by sibling modules (cycleDetection, topologicalSort)
 * and unit tests, but not re-exported from the public `index.ts`.
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
 * Shared implementation for building a directed adjacency list.
 * Iterates `deps` once and maps each edge using caller-supplied key/value selectors.
 *
 * @param deps - The dependency edges to index.
 * @param keyFn - Extracts the map key (i.e. the "from" node) from each edge.
 * @param valueFn - Extracts the map value (i.e. the "to" node) from each edge.
 * @returns A directed adjacency-list map.
 */
function buildDirectedAdjacencyList(
  deps: Dependency[],
  keyFn: (dep: Dependency) => TaskId,
  valueFn: (dep: Dependency) => TaskId
): Map<TaskId, TaskId[]> {
  const graph = new Map<TaskId, TaskId[]>();
  for (const dep of deps) {
    getOrCreateList(graph, keyFn(dep)).push(valueFn(dep));
  }
  return graph;
}

/**
 * Build a forward adjacency list (fromTaskId → [toTaskId, ...]) from a dependency array.
 *
 * @param deps - The dependency edges to index.
 * @returns A map from each source task to its direct successors.
 * @remarks Duplicate edges in `deps` (same fromTaskId/toTaskId pair appearing more than
 * once) will produce duplicate entries in the returned adjacency lists. The store layer
 * is responsible for ensuring uniqueness before calling this function.
 */
export function buildAdjacencyList(deps: Dependency[]): Map<TaskId, TaskId[]> {
  return buildDirectedAdjacencyList(
    deps,
    (dep) => dep.fromTaskId,
    (dep) => dep.toTaskId
  );
}

/**
 * Build a reverse adjacency list (toTaskId → [fromTaskId, ...]) for predecessor traversal.
 *
 * @param deps - The dependency edges to index.
 * @returns A map from each target task to its direct predecessors.
 * @remarks Duplicate edges in `deps` (same fromTaskId/toTaskId pair appearing more than
 * once) will produce duplicate entries in the returned adjacency lists. The store layer
 * is responsible for ensuring uniqueness before calling this function.
 */
export function buildReverseAdjacencyList(
  deps: Dependency[]
): Map<TaskId, TaskId[]> {
  return buildDirectedAdjacencyList(
    deps,
    (dep) => dep.toTaskId,
    (dep) => dep.fromTaskId
  );
}

/**
 * BFS from `startId` returning all reachable nodes (excluding `startId` itself).
 * Overall complexity: O(V + E).
 *
 * `startId` is pre-marked as visited so it is never added to the result set,
 * even in graphs that contain cycles leading back to it.
 *
 * @param startId - The node to start traversal from (excluded from results).
 * @param graph - Forward adjacency list (node → neighbors).
 * @returns The set of all nodes reachable from `startId`, not including `startId` itself.
 * @remarks Uses a pointer-based queue (`head` index advances instead of `Array.shift`)
 * to achieve O(1) dequeue. Processed entries remain in the array — O(V) transient
 * memory — which is an intentional trade-off to avoid the O(n) cost of
 * `Array.prototype.shift` on each iteration.
 */
export function bfsReachable(
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
