/**
 * Internal graph construction utilities.
 * Not exported from the public graph index — consumed only within this package.
 */

import type { TaskId } from "../../types/branded.types";
import type { Dependency } from "../../types/dependency.types";

/**
 * Returns the array stored under `key`, inserting an empty one first if absent.
 * Avoids non-null assertions at call sites where the key may not yet exist.
 */
export function ensureList<K, V>(map: Map<K, V[]>, key: K): V[] {
  let list = map.get(key);
  if (list === undefined) {
    list = [];
    map.set(key, list);
  }
  return list;
}

/** Build a forward adjacency list (fromTaskId → [toTaskId, ...]) from a dependency array. */
export function buildAdjacencyList(deps: Dependency[]): Map<TaskId, TaskId[]> {
  const graph = new Map<TaskId, TaskId[]>();
  for (const dep of deps) {
    ensureList(graph, dep.fromTaskId).push(dep.toTaskId);
  }
  return graph;
}

/** Build a reverse adjacency list (toTaskId → [fromTaskId, ...]) for predecessor traversal. */
export function buildReverseAdjacencyList(
  deps: Dependency[]
): Map<TaskId, TaskId[]> {
  const graph = new Map<TaskId, TaskId[]>();
  for (const dep of deps) {
    ensureList(graph, dep.toTaskId).push(dep.fromTaskId);
  }
  return graph;
}
